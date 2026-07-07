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
    {}
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
