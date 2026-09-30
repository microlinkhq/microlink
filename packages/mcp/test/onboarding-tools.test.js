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

test('microlink_create_checkout_session posts the public signup endpoint', async t => {
  let request
  stubFetch(t, async (input, options) => {
    request = { input, options }
    return jsonResponse({
      sessionId: 'cs_test_123',
      checkoutUrl: 'https://checkout.stripe.com/c/pay/test',
      expiresAt: 1_700_000_000
    })
  })

  const result = await captureTool(
    checkoutCreate
  ).microlink_create_checkout_session({}, {})

  assert.equal(
    request.input,
    'https://dashboard.microlink.io/api/v1/checkout/signup'
  )
  assert.equal(request.options.method, 'POST')
  assert.equal(request.options.body, undefined)
  assert.deepEqual(result.structuredContent.data, {
    sessionId: 'cs_test_123',
    checkoutUrl: 'https://checkout.stripe.com/c/pay/test',
    expiresAt: 1_700_000_000
  })
})

test('microlink_create_checkout_session ignores leftover email and planId fields', async t => {
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
    { email: 'agent@example.com', planId: 'pro', idempotencyKey: 'logical-call-123' },
    {}
  )

  assert.equal(
    request.input,
    'https://dashboard.microlink.io/api/v1/checkout/signup'
  )
  assert.equal(request.options.headers, undefined)
  assert.equal(result.isError, false)
  assert.equal(result.structuredContent.data.sessionId, 'cs_test_123')
})

test('signup errors surface the dashboard message', async t => {
  stubFetch(t, async () => jsonResponse({ error: 'No plans available' }, 503))

  const result = await captureTool(
    checkoutCreate
  ).microlink_create_checkout_session({}, {})
  const error = JSON.parse(result.content[0].text)

  assert.equal(result.isError, true)
  assert.equal(result.structuredContent, undefined)
  assert.equal(error.reason, 'dashboard_request_failed')
  assert.equal(error.statusCode, 503)
  assert.equal(error.message, 'No plans available')
})

test('microlink_get_checkout_session returns ready state without the API secret', async t => {
  let requestUrl
  stubFetch(t, async input => {
    requestUrl = input
    return jsonResponse({
      state: 'ready',
      apiKey: 'ml_secret'
    })
  })

  const result = await captureTool(
    checkoutStatus
  ).microlink_get_checkout_session({ sessionId: 'cs_test_123' }, {})

  assert.equal(
    requestUrl,
    'https://dashboard.microlink.io/api/v1/checkout/sessions/cs_test_123'
  )
  assert.deepEqual(result.structuredContent.data, { state: 'ready' })
  assert.equal(result.content[0].text.includes('ml_secret'), false)
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

test('transport errors stay recoverable without an idempotency key', async t => {
  stubFetch(t, async () => {
    throw new TypeError('fetch failed')
  })

  const result = await captureTool(
    checkoutCreate
  ).microlink_create_checkout_session({}, {})
  const error = JSON.parse(result.content[0].text)

  assert.equal(result.isError, true)
  assert.equal(error.reason, 'dashboard_request_failed')
  assert.match(error.hint, /network access/)
  assert.equal(error.idempotencyKey, undefined)
})
