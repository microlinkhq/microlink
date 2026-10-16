import test from 'node:test'
import assert from 'node:assert/strict'

import { resetCheckoutHandshakes } from '../src/dashboard-client.js'
import { outputSchemas } from '../src/output-schemas.js'
import { checkoutCreate } from '../src/tools/create-checkout-session.js'
import { checkoutStatus } from '../src/tools/get-checkout-session.js'
import { plans } from '../src/tools/list-plans.js'

let tail = Promise.resolve()

function serial (name, fn) {
  test(name, async t => {
    const previous = tail
    let release
    tail = new Promise(resolve => {
      release = resolve
    })
    await previous
    try {
      await fn(t)
    } finally {
      resetCheckoutHandshakes()
      release()
    }
  })
}

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
  globalThis.fetch = async (input, options) => {
    const url = String(input)
    if (
      url.startsWith('http://127.0.0.1:') ||
      url.startsWith('http://localhost:')
    ) {
      return originalFetch(input, options)
    }
    return implementation(input, options)
  }
}

function create (input) {
  return captureTool(checkoutCreate).microlink_create_checkout_session(
    input,
    {}
  )
}

function status (input) {
  return captureTool(checkoutStatus).microlink_get_checkout_session(input, {})
}

function postConnect (connectUrl, body) {
  const url = new URL(connectUrl)
  const port = url.searchParams.get('port')
  return fetch(`http://127.0.0.1:${port}/`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      state: url.searchParams.get('state'),
      ...body
    })
  })
}

serial('microlink_list_plans returns the sellable plan catalog', async t => {
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

serial(
  'microlink_create_checkout_session returns a connect URL and no checkout yet',
  async t => {
    let calls = 0
    stubFetch(t, async () => {
      calls++
      return jsonResponse({})
    })

    const result = await create({ planId: 'pro' })
    const data = result.structuredContent.data

    outputSchemas.create_checkout_session.parse(data)
    assert.equal(result.isError, false)
    assert.equal(calls, 0)
    assert.match(data.sessionId, /^hs_/)
    assert.match(data.idempotencyKey, /^[0-9a-f-]{36}$/)
    const url = new URL(data.connectUrl)
    assert.equal(url.origin, 'https://dashboard.microlink.io')
    assert.equal(url.pathname, '/connect')
    assert.equal(url.searchParams.get('plan'), 'pro')
    assert.match(url.searchParams.get('port'), /^[0-9]+$/)
    assert.match(url.searchParams.get('state'), /^[0-9a-f]{32}$/)
    assert.equal(data.checkoutUrl, undefined)
  }
)

serial(
  'microlink_create_checkout_session rejects email and missing planId',
  async t => {
    let calls = 0
    stubFetch(t, async () => {
      calls++
      return jsonResponse({})
    })

    const emailed = await create({ email: 'agent@example.com', planId: 'pro' })
    const missing = await create({})

    assert.equal(emailed.isError, true)
    assert.match(emailed.content[0].text, /email/)
    assert.equal(missing.isError, true)
    assert.equal(calls, 0)
  }
)

serial(
  'microlink_create_checkout_session reuses an in-flight idempotency key',
  async t => {
    stubFetch(t, async () => jsonResponse({}))

    const first = await create({
      planId: 'pro',
      idempotencyKey: 'logical-call-123'
    })
    const second = await create({
      planId: 'pro',
      idempotencyKey: 'logical-call-123'
    })

    assert.equal(
      second.structuredContent.data.connectUrl,
      first.structuredContent.data.connectUrl
    )
    assert.equal(
      second.structuredContent.data.sessionId,
      first.structuredContent.data.sessionId
    )

    const conflict = await create({
      planId: 'starter',
      idempotencyKey: 'logical-call-123'
    })
    const error = JSON.parse(conflict.content[0].text)
    assert.equal(conflict.isError, true)
    assert.equal(error.reason, 'idempotency_conflict')
    assert.equal(error.idempotencyKey, 'logical-call-123')
  }
)

serial(
  'concurrent creates with one idempotency key share a handshake',
  async t => {
    stubFetch(t, async () => jsonResponse({}))

    const [first, second] = await Promise.all([
      create({ planId: 'pro', idempotencyKey: 'logical-call-123' }),
      create({ planId: 'pro', idempotencyKey: 'logical-call-123' })
    ])

    assert.equal(first.isError, false)
    assert.equal(second.isError, false)
    assert.equal(
      second.structuredContent.data.connectUrl,
      first.structuredContent.data.connectUrl
    )
    assert.equal(
      second.structuredContent.data.sessionId,
      first.structuredContent.data.sessionId
    )
  }
)

serial(
  'connect callback posts checkout with the token and strips the API secret',
  async t => {
    const requests = []
    let releaseCheckout
    const checkoutPosted = new Promise(resolve => {
      releaseCheckout = resolve
    })
    stubFetch(t, async (input, options) => {
      const url = String(input)
      requests.push({ url, options })
      if (options?.method === 'POST') {
        releaseCheckout()
        return jsonResponse({
          sessionId: 'cs_test_123',
          checkoutUrl: 'https://checkout.stripe.com/c/pay/test',
          expiresAt: 1_700_000_000
        })
      }
      return jsonResponse({
        state: 'ready',
        apiKey: 'ml_secret'
      })
    })

    const created = await create({
      planId: 'pro',
      label: 'production',
      idempotencyKey: 'logical-call-123'
    })
    const data = created.structuredContent.data
    const callback = await postConnect(data.connectUrl, {
      token: 'connect_secret'
    })
    assert.equal(callback.status, 204)
    await checkoutPosted

    const again = await postConnect(data.connectUrl, {
      token: 'connect_secret'
    }).catch(error => error)
    assert.ok(again instanceof Error || again.status === 409)

    const polled = await status({ sessionId: data.sessionId })
    outputSchemas.get_checkout_session.parse(polled.structuredContent.data)

    assert.equal(requests.length, 2)
    assert.equal(
      requests[0].url,
      'https://dashboard.microlink.io/api/v1/checkout/sessions'
    )
    assert.equal(
      requests[0].options.headers.authorization,
      'Bearer connect_secret'
    )
    assert.equal(
      requests[0].options.headers['idempotency-key'],
      'logical-call-123'
    )
    assert.deepEqual(JSON.parse(requests[0].options.body), {
      planId: 'pro',
      label: 'production'
    })
    assert.equal(
      requests[1].url,
      'https://dashboard.microlink.io/api/v1/checkout/sessions/cs_test_123'
    )
    assert.deepEqual(polled.structuredContent.data, {
      state: 'ready',
      checkoutUrl: 'https://checkout.stripe.com/c/pay/test'
    })
    assert.equal(polled.content[0].text.includes('ml_secret'), false)
    assert.equal(polled.content[0].text.includes('connect_secret'), false)

    const retried = await create({
      planId: 'pro',
      label: 'production',
      idempotencyKey: 'logical-call-123'
    })
    assert.equal(
      retried.structuredContent.data.checkoutUrl,
      'https://checkout.stripe.com/c/pay/test'
    )
    assert.equal(requests.length, 2)
  }
)

serial('a mismatched connect state does not open checkout', async t => {
  let calls = 0
  stubFetch(t, async () => {
    calls++
    return jsonResponse({})
  })

  const created = await create({ planId: 'pro' })
  const callback = await postConnect(
    created.structuredContent.data.connectUrl,
    {
      state: 'not-the-state',
      token: 'connect_secret'
    }
  )
  const polled = await status({
    sessionId: created.structuredContent.data.sessionId
  })

  assert.equal(callback.status, 400)
  assert.equal(calls, 0)
  assert.equal(polled.structuredContent.data.state, 'open')
  assert.equal(
    polled.structuredContent.data.connectUrl,
    created.structuredContent.data.connectUrl
  )
  assert.equal(polled.content[0].text.includes('connect_secret'), false)
})

serial('parallel connect callbacks open one checkout session', async t => {
  let posts = 0
  stubFetch(t, async (_input, options) => {
    if (options?.method === 'POST') {
      posts++
      return jsonResponse({
        sessionId: 'cs_test_123',
        checkoutUrl: 'https://checkout.stripe.com/c/pay/test'
      })
    }
    return jsonResponse({ state: 'open' })
  })

  const created = await create({ planId: 'pro' })
  const connectUrl = created.structuredContent.data.connectUrl
  await Promise.allSettled([
    postConnect(connectUrl, { token: 'connect_secret' }),
    postConnect(connectUrl, { token: 'other_secret' })
  ])
  await new Promise(resolve => setImmediate(resolve))

  assert.equal(posts, 1)
})

serial('unknown plan surfaces on poll with the idempotency key', async t => {
  stubFetch(t, async () => jsonResponse({ error: 'Unknown plan' }, 400))

  const created = await create({
    planId: 'nope',
    idempotencyKey: 'logical-call-123'
  })
  await postConnect(created.structuredContent.data.connectUrl, {
    token: 'connect_secret'
  })
  await new Promise(resolve => setImmediate(resolve))

  const polled = await status({
    sessionId: created.structuredContent.data.sessionId
  })
  const error = JSON.parse(polled.content[0].text)

  assert.equal(polled.isError, true)
  assert.equal(error.reason, 'unknown_plan')
  assert.equal(error.idempotencyKey, 'logical-call-123')
  assert.match(error.hint, /microlink_list_plans/)
  assert.match(error.hint, /new `idempotencyKey`/)
  assert.equal(polled.content[0].text.includes('connect_secret'), false)
})

serial(
  'transport errors stay recoverable with the idempotency key',
  async t => {
    stubFetch(t, async () => {
      throw new TypeError('fetch failed')
    })

    const created = await create({
      planId: 'pro',
      idempotencyKey: 'logical-call-123'
    })
    await postConnect(created.structuredContent.data.connectUrl, {
      token: 'connect_secret'
    })
    await new Promise(resolve => setImmediate(resolve))

    const polled = await status({
      sessionId: created.structuredContent.data.sessionId
    })
    const error = JSON.parse(polled.content[0].text)

    assert.equal(polled.isError, true)
    assert.equal(error.reason, 'dashboard_request_failed')
    assert.equal(error.idempotencyKey, 'logical-call-123')
    assert.match(error.hint, /network access/)
  }
)

serial('an unfinished connect handshake expires', async t => {
  const previous = process.env.MICROLINK_CONNECT_TIMEOUT_MS
  process.env.MICROLINK_CONNECT_TIMEOUT_MS = '30'
  t.after(() => {
    if (previous == null) delete process.env.MICROLINK_CONNECT_TIMEOUT_MS
    else process.env.MICROLINK_CONNECT_TIMEOUT_MS = previous
  })
  stubFetch(t, async () => jsonResponse({}))

  const created = await create({ planId: 'pro' })
  await new Promise(resolve => setTimeout(resolve, 80))
  const polled = await status({
    sessionId: created.structuredContent.data.sessionId
  })

  assert.equal(polled.structuredContent.data.state, 'expired')
})

serial(
  'microlink_get_checkout_session strips apiKey from a dashboard session',
  async t => {
    let requestUrl
    stubFetch(t, async input => {
      requestUrl = input
      return jsonResponse({
        state: 'ready',
        apiKey: 'ml_secret'
      })
    })

    const result = await status({ sessionId: 'cs_test_123' })

    assert.equal(
      requestUrl,
      'https://dashboard.microlink.io/api/v1/checkout/sessions/cs_test_123'
    )
    assert.deepEqual(result.structuredContent.data, { state: 'ready' })
    assert.equal(result.content[0].text.includes('ml_secret'), false)
  }
)

serial(
  'microlink_get_checkout_session returns a non-object poll body unchanged',
  async t => {
    stubFetch(t, async () => jsonResponse(null))

    const result = await status({ sessionId: 'cs_test_null' })

    assert.equal(result.isError, false)
    assert.equal(result.structuredContent.data, null)
  }
)

serial(
  'microlink_get_checkout_session returns an array poll body unchanged',
  async t => {
    stubFetch(t, async () => jsonResponse(['ml_secret']))

    const result = await status({ sessionId: 'cs_test_array' })

    assert.equal(result.isError, false)
    assert.deepEqual(result.structuredContent.data, ['ml_secret'])
  }
)

serial('unknown checkout session explains how to recover', async t => {
  stubFetch(t, async () =>
    jsonResponse({ error: 'Unknown checkout session' }, 404)
  )

  const missing = await status({ sessionId: 'missing' })
  const handshake = await status({ sessionId: 'hs_missing' })

  for (const result of [missing, handshake]) {
    const error = JSON.parse(result.content[0].text)
    assert.equal(result.isError, true)
    assert.equal(error.reason, 'unknown_checkout_session')
    assert.match(error.hint, /exact `sessionId`/)
  }
})

serial(
  'onboarding tools expose MCP titles, output schemas and safe annotations',
  () => {
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
  }
)
