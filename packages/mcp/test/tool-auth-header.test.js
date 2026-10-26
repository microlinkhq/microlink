import test from 'node:test'
import assert from 'node:assert/strict'

import { z } from 'zod'

import { register } from '../src/tools/register.js'

function makeJsonResponse (payload, { status = 200, headers = {} } = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...headers
    }
  })
}

function getRequestSnapshot (input, init) {
  const request = input instanceof Request ? input : new Request(input, init)
  return {
    url: new URL(request.url),
    headers: request.headers
  }
}

function createRegisteredHandler (inputSchema) {
  let handler

  register(
    {
      registerTool: (...args) => {
        handler = args[2]
      }
    },
    'microlink.extract',
    'Test tool',
    inputSchema,
    (client, { url, ...options }) => client.metadata(url, options)
  )

  return handler
}

const inputSchema = z
  .object({
    url: z.string().url(),
    apiKey: z.string().min(1).optional()
  })
  .strict()

test('uses Authorization Bearer header api key when tool input apiKey is missing', async t => {
  const originalFetch = globalThis.fetch
  t.after(() => {
    globalThis.fetch = originalFetch
  })

  globalThis.fetch = async (input, init) => {
    const request = getRequestSnapshot(input, init)
    const requestUrl = request.url
    assert.equal(requestUrl.origin, 'https://pro.microlink.io')
    assert.equal(request.headers.get('x-api-key'), 'header-key')

    return makeJsonResponse({ status: 'success', data: { ok: true } })
  }

  const handler = createRegisteredHandler(inputSchema)
  const result = await handler(
    { url: 'https://example.com' },
    {
      requestInfo: {
        headers: {
          Authorization: 'Bearer header-key'
        }
      }
    }
  )

  assert.equal(result.isError, false)
})

test('does not override explicit tool input apiKey with Authorization Bearer header', async t => {
  const originalFetch = globalThis.fetch
  t.after(() => {
    globalThis.fetch = originalFetch
  })

  globalThis.fetch = async (input, init) => {
    const request = getRequestSnapshot(input, init)
    const requestUrl = request.url
    assert.equal(requestUrl.origin, 'https://pro.microlink.io')
    assert.equal(request.headers.get('x-api-key'), 'explicit-key')

    return makeJsonResponse({ status: 'success', data: { ok: true } })
  }

  const handler = createRegisteredHandler(inputSchema)
  const result = await handler(
    {
      url: 'https://example.com',
      apiKey: 'explicit-key'
    },
    {
      requestInfo: {
        headers: {
          authorization: 'Bearer header-key'
        }
      }
    }
  )

  assert.equal(result.isError, false)
})

test('uses x-api-key header when authorization bearer token is not present', async t => {
  const originalFetch = globalThis.fetch
  t.after(() => {
    globalThis.fetch = originalFetch
  })

  globalThis.fetch = async (input, init) => {
    const request = getRequestSnapshot(input, init)
    const requestUrl = request.url
    assert.equal(requestUrl.origin, 'https://pro.microlink.io')
    assert.equal(request.headers.get('x-api-key'), 'header-x-api-key')

    return makeJsonResponse({ status: 'success', data: { ok: true } })
  }

  const handler = createRegisteredHandler(inputSchema)
  const result = await handler(
    { url: 'https://example.com' },
    {
      requestInfo: {
        headers: {
          'x-api-key': 'header-x-api-key'
        }
      }
    }
  )

  assert.equal(result.isError, false)
})

function mockRateLimitedFetch (t) {
  const originalFetch = globalThis.fetch
  t.after(() => {
    globalThis.fetch = originalFetch
  })

  globalThis.fetch = async () =>
    makeJsonResponse(
      { status: 'fail', code: 'ERATE', message: 'Rate limit exceeded.' },
      { status: 429 }
    )
}

function withoutEnvApiKey (t) {
  const original = process.env.MICROLINK_API_KEY
  delete process.env.MICROLINK_API_KEY
  t.after(() => {
    if (original !== undefined) process.env.MICROLINK_API_KEY = original
  })
}

test('a keyless 429 carries the keyless daily quota hint', async t => {
  withoutEnvApiKey(t)
  mockRateLimitedFetch(t)

  const handler = createRegisteredHandler(inputSchema)
  const result = await handler({ url: 'https://example.com' })
  const error = JSON.parse(result.content[0].text)

  assert.equal(result.isError, true)
  assert.equal(error.reason, 'quota_exceeded')
  assert.match(error.hint, /Free daily quota reached/)
})

test('a keyed 429 carries the API key quota hint', async t => {
  withoutEnvApiKey(t)
  mockRateLimitedFetch(t)

  const handler = createRegisteredHandler(inputSchema)
  const result = await handler({ url: 'https://example.com', apiKey: 'my-key' })
  const error = JSON.parse(result.content[0].text)

  assert.equal(result.isError, true)
  assert.equal(error.reason, 'quota_exceeded')
  assert.match(error.hint, /Rate limit reached on your API key/)
})
