import test from 'node:test'
import assert from 'node:assert/strict'

import { checkoutCreate } from '../src/tools/create-checkout-session.js'
import { checkoutStatus } from '../src/tools/get-checkout-session.js'
import { plans } from '../src/tools/list-plans.js'

function captureTool (registerTool) {
  const handlers = {}
  registerTool({
    registerTool: (name, _config, handler) => {
      handlers[name] = handler
    }
  })
  return handlers
}

function jsonResponse (body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' }
  })
}

function stubFetch (t, implementation) {
  const originalFetch = globalThis.fetch
  t.after(() => {
    globalThis.fetch = originalFetch
  })
  globalThis.fetch = implementation
}

test('microlink_list_plans returns the sellable plan catalog', async t => {
  const catalog = {
    plans: [{ id: 'pro', limit: 100000, price: 20, currency: 'usd' }]
  }
  let request
  stubFetch(t, async (input, options) => {
    request = { input, options }
    return jsonResponse(catalog)
  })

  const result = await captureTool(plans).microlink_list_plans({}, {})

  assert.equal(request.input, 'https://dashboard.microlink.io/api/v1/plans')
  assert.deepEqual(request.options, {})
  assert.deepEqual(result.structuredContent.data, catalog)
})

test('microlink_create_checkout_session generates and returns an idempotency key', async t => {
  let request
  stubFetch(t, async (input, options) => {
    request = { input, options }
    return jsonResponse({
      sessionId: 'cs_test_123',
      checkoutUrl: 'https://checkout.stripe.com/c/pay/test'
    })
  })

  const result = await captureTool(
    checkoutCreate
  ).microlink_create_checkout_session(
    { email: 'agent@example.com', planId: 'pro' },
    {}
  )

  const key = request.options.headers['idempotency-key']
  assert.match(
    key,
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
  )
  assert.equal(result.structuredContent.data.idempotencyKey, key)
  assert.equal(request.options.method, 'POST')
  assert.deepEqual(JSON.parse(request.options.body), {
    email: 'agent@example.com',
    planId: 'pro',
    label: 'default'
  })
})

test('microlink_create_checkout_session forwards a caller idempotency key', async t => {
  stubFetch(t, async (_input, options) => {
    assert.equal(options.headers['idempotency-key'], 'logical-call-123')
    return jsonResponse({
      sessionId: 'cs_test_123',
      checkoutUrl: 'https://checkout.stripe.com/c/pay/test'
    })
  })

  const result = await captureTool(
    checkoutCreate
  ).microlink_create_checkout_session(
    {
      email: 'agent@example.com',
      planId: 'pro',
      label: 'production',
      idempotencyKey: 'logical-call-123'
    },
    {}
  )

  assert.equal(result.structuredContent.data.idempotencyKey, 'logical-call-123')
})

test('unknown plan error includes available plans and a retry hint', async t => {
  let calls = 0
  stubFetch(t, async () => {
    calls++
    if (calls === 1) return jsonResponse({ error: 'Unknown plan' }, 400)
    return jsonResponse({
      plans: [{ id: 'pro', limit: 100000, price: 20, currency: 'usd' }]
    })
  })

  const result = await captureTool(
    checkoutCreate
  ).microlink_create_checkout_session(
    {
      email: 'agent@example.com',
      planId: 'unknown',
      idempotencyKey: 'logical-call-123'
    },
    {}
  )
  const error = JSON.parse(result.content[0].text)

  assert.equal(result.isError, true)
  assert.equal(result.structuredContent, undefined)
  assert.equal(error.reason, 'unknown_plan')
  assert.equal(error.idempotencyKey, 'logical-call-123')
  assert.equal(error.availablePlans[0].id, 'pro')
  assert.match(error.hint, /same `idempotencyKey`/)
})

test('microlink_get_checkout_session returns ready state and key id', async t => {
  const status = {
    state: 'ready',
    sessionId: 'cs_test_123',
    email: 'agent@example.com',
    planId: 'pro',
    sessionStatus: 'complete',
    paymentStatus: 'paid',
    subscriptionId: 'sub_123',
    awsKeyId: 'key_123'
  }
  let requestUrl
  stubFetch(t, async input => {
    requestUrl = input
    return jsonResponse(status)
  })

  const result = await captureTool(
    checkoutStatus
  ).microlink_get_checkout_session({ sessionId: 'cs_test_123' }, {})

  assert.equal(
    requestUrl,
    'https://dashboard.microlink.io/api/v1/checkout/sessions/cs_test_123'
  )
  assert.deepEqual(result.structuredContent.data, status)
})

test('unknown checkout session explains how to recover', async t => {
  stubFetch(t, async () =>
    jsonResponse({ error: 'Unknown checkout session' }, 404)
  )

  const result = await captureTool(
    checkoutStatus
  ).microlink_get_checkout_session({ sessionId: 'missing' }, {})
  const error = JSON.parse(result.content[0].text)

  assert.equal(result.isError, true)
  assert.equal(error.reason, 'unknown_checkout_session')
  assert.match(error.hint, /exact `sessionId`/)
})

test('onboarding tools expose MCP titles, output schemas and safe annotations', () => {
  const registered = {}
  const server = {
    registerTool: (name, config) => {
      registered[name] = config
    }
  }
  plans(server)
  checkoutCreate(server)
  checkoutStatus(server)

  assert.equal(registered.microlink_list_plans.title, 'Plans')
  assert.equal(
    registered.microlink_create_checkout_session.title,
    'Create checkout session'
  )
  assert.equal(
    registered.microlink_get_checkout_session.title,
    'Checkout session status'
  )

  for (const config of Object.values(registered)) {
    assert.ok(config.outputSchema?.data)
    assert.equal(config.annotations.openWorldHint, true)
    assert.equal(config.annotations.destructiveHint, false)
  }
  assert.equal(registered.microlink_list_plans.annotations.readOnlyHint, true)
  assert.equal(
    registered.microlink_get_checkout_session.annotations.readOnlyHint,
    true
  )
  assert.equal(
    registered.microlink_create_checkout_session.annotations.readOnlyHint,
    false
  )
})
