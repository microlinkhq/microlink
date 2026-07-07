import test from 'node:test'
import assert from 'node:assert/strict'

import { callMicrolink } from '../src/microlink-client.js'

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
    method: request.method,
    headers: request.headers
  }
}

test('builds free endpoint request with flattened query params', async t => {
  const originalFetch = globalThis.fetch
  const originalEnvKey = process.env.MICROLINK_API_KEY

  t.after(() => {
    globalThis.fetch = originalFetch

    if (originalEnvKey === undefined) {
      delete process.env.MICROLINK_API_KEY
    } else {
      process.env.MICROLINK_API_KEY = originalEnvKey
    }
  })

  delete process.env.MICROLINK_API_KEY

  globalThis.fetch = async (input, init) => {
    const request = getRequestSnapshot(input, init)
    const url = request.url

    assert.equal(url.origin, 'https://api.microlink.io')
    assert.equal(url.searchParams.get('url'), 'https://example.com')
    assert.equal(url.searchParams.get('screenshot.type'), 'png')
    assert.equal(url.searchParams.get('screenshot.overlay.browser'), 'dark')
    assert.equal(url.searchParams.get('styles.0'), 'body{color:red}')
    assert.equal(url.searchParams.get('styles.1'), 'p{margin:0}')
    assert.equal(url.searchParams.get('waitUntil.0'), 'load')
    assert.equal(url.searchParams.get('waitUntil.1'), 'networkidle2')

    assert.equal(request.method, 'GET')
    assert.equal(request.headers.get('x-api-key'), null)

    return makeJsonResponse({ status: 'success', data: { ok: true } })
  }

  const result = await callMicrolink({
    params: {
      url: 'https://example.com',
      screenshot: {
        type: 'png',
        overlay: {
          browser: 'dark'
        }
      },
      styles: ['body{color:red}', 'p{margin:0}'],
      waitUntil: ['load', 'networkidle2']
    },
    forcedFlags: {
      screenshot: true
    }
  })

  assert.equal(result.ok, true)
  assert.equal('response' in result.body, false)
})

test('uses request apiKey, routes to pro endpoint, and strips apiKey from query', async t => {
  const originalFetch = globalThis.fetch

  t.after(() => {
    globalThis.fetch = originalFetch
  })

  globalThis.fetch = async (input, init) => {
    const request = getRequestSnapshot(input, init)
    const url = request.url

    assert.equal(url.origin, 'https://pro.microlink.io')
    assert.equal(url.searchParams.get('apiKey'), null)
    assert.equal(url.searchParams.get('url'), 'https://example.com')
    assert.equal(request.headers.get('x-api-key'), 'request-key')

    return makeJsonResponse(
      { status: 'success', data: { id: 1 } },
      {
        headers: {
          'x-request-id': 'abc-123',
          'x-cache-status': 'HIT',
          'cf-cache-status': 'HIT',
          'cache-control': 'public, max-age=60'
        }
      }
    )
  }

  const result = await callMicrolink({
    params: {
      url: 'https://example.com',
      apiKey: 'request-key'
    }
  })

  assert.equal(result.endpoint, 'https://pro.microlink.io')
  assert.equal(result.headers['x-request-id'], 'abc-123')
  assert.equal(result.headers['x-cache-status'], 'HIT')
  assert.equal(result.headers['cf-cache-status'], 'HIT')
  assert.equal(result.headers['cache-control'], 'public, max-age=60')
})

test('uses MICROLINK_API_KEY env var when request apiKey is missing', async t => {
  const originalFetch = globalThis.fetch
  const originalEnvKey = process.env.MICROLINK_API_KEY

  t.after(() => {
    globalThis.fetch = originalFetch

    if (originalEnvKey === undefined) {
      delete process.env.MICROLINK_API_KEY
    } else {
      process.env.MICROLINK_API_KEY = originalEnvKey
    }
  })

  process.env.MICROLINK_API_KEY = 'env-key'

  globalThis.fetch = async (input, init) => {
    const request = getRequestSnapshot(input, init)
    const url = request.url

    assert.equal(url.origin, 'https://pro.microlink.io')
    assert.equal(request.headers.get('x-api-key'), 'env-key')

    return makeJsonResponse({ status: 'success', data: {} })
  }

  const result = await callMicrolink({
    params: {
      url: 'https://example.com'
    }
  })

  assert.equal(result.endpoint, 'https://pro.microlink.io')
})

test('does not add forced flag when sub-params already cover it', async t => {
  const originalFetch = globalThis.fetch

  t.after(() => {
    globalThis.fetch = originalFetch
  })

  globalThis.fetch = async (input, init) => {
    const request = getRequestSnapshot(input, init)
    const url = request.url

    // screenshot.type is present — forced screenshot=true must NOT be added on top
    assert.equal(url.searchParams.get('screenshot.type'), 'jpeg')
    assert.equal(url.searchParams.get('screenshot'), null)

    // insights.lighthouse is present — forced insights=true must NOT be added on top
    assert.equal(url.searchParams.get('insights.lighthouse'), 'true')
    assert.equal(url.searchParams.get('insights'), null)

    return makeJsonResponse({ status: 'success', data: {} })
  }

  await callMicrolink({
    params: {
      url: 'https://example.com',
      screenshot: { type: 'jpeg' },
      insights: { lighthouse: true }
    },
    forcedFlags: {
      screenshot: true,
      insights: true
    }
  })
})

test('adds forced flag when no sub-params are present', async t => {
  const originalFetch = globalThis.fetch

  t.after(() => {
    globalThis.fetch = originalFetch
  })

  globalThis.fetch = async (input, init) => {
    const request = getRequestSnapshot(input, init)
    const url = request.url

    assert.equal(url.searchParams.get('screenshot'), 'true')
    assert.equal(url.searchParams.get('pdf'), 'true')

    return makeJsonResponse({ status: 'success', data: {} })
  }

  await callMicrolink({
    params: { url: 'https://example.com' },
    forcedFlags: { screenshot: true, pdf: true }
  })
})

test('adds forced flag when option object is present but empty', async t => {
  const originalFetch = globalThis.fetch

  t.after(() => {
    globalThis.fetch = originalFetch
  })

  globalThis.fetch = async (input, init) => {
    const request = getRequestSnapshot(input, init)
    const url = request.url

    assert.equal(url.searchParams.get('screenshot'), 'true')
    assert.equal(url.searchParams.get('screenshot.type'), null)

    return makeJsonResponse({ status: 'success', data: {} })
  }

  await callMicrolink({
    params: {
      url: 'https://example.com',
      screenshot: {}
    },
    forcedFlags: {
      screenshot: true
    }
  })
})

test('normalizes empty object toggles to true without forced flags', async t => {
  const originalFetch = globalThis.fetch

  t.after(() => {
    globalThis.fetch = originalFetch
  })

  globalThis.fetch = async (input, init) => {
    const request = getRequestSnapshot(input, init)
    const url = request.url

    assert.equal(url.searchParams.get('screenshot'), 'true')
    assert.equal(url.searchParams.get('pdf'), 'true')
    assert.equal(url.searchParams.get('insights'), 'true')

    return makeJsonResponse({ status: 'success', data: {} })
  }

  await callMicrolink({
    params: {
      url: 'https://example.com',
      screenshot: {},
      pdf: {},
      insights: {}
    }
  })
})

test('preserves Microlink API error payload, status code, and response headers', async t => {
  const originalFetch = globalThis.fetch
  const originalEnvKey = process.env.MICROLINK_API_KEY

  t.after(() => {
    globalThis.fetch = originalFetch

    if (originalEnvKey === undefined) {
      delete process.env.MICROLINK_API_KEY
    } else {
      process.env.MICROLINK_API_KEY = originalEnvKey
    }
  })

  delete process.env.MICROLINK_API_KEY

  globalThis.fetch = async () => {
    return new Response(
      JSON.stringify({
        status: 'fail',
        code: 'ERATELIMIT',
        id: 'err_123',
        report: 'https://example.com/report/err_123',
        message: 'Rate limit reached.',
        more: 'https://microlink.io/eratelimit',
        data: {
          url: 'Rate limit reached.'
        }
      }),
      {
        status: 429,
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'x-request-id': 'req_123',
          'x-rate-limit-remaining': '0'
        }
      }
    )
  }

  const result = await callMicrolink({
    params: {
      url: 'https://example.com'
    }
  })

  assert.equal(result.ok, false)
  assert.equal(result.statusCode, 429)
  assert.equal(result.body.status, 'fail')
  assert.equal(result.body.code, 'ERATELIMIT')
  assert.equal(result.body.id, 'err_123')
  assert.equal(result.body.report, 'https://example.com/report/err_123')
  assert.match(result.body.message, /^ERATELIMIT, Rate limit reached\./)
  assert.match(result.body.message, /50 requests\/day/)
  assert.match(result.body.message, /microlink\.io\/#pricing/)
  assert.equal(result.body.more, 'https://microlink.io/eratelimit')
  assert.equal(result.headers['x-request-id'], 'req_123')
  assert.equal(result.headers['x-rate-limit-remaining'], '0')
})

test('does not append free daily quota hint for 429 responses on pro endpoint', async t => {
  const originalFetch = globalThis.fetch

  t.after(() => {
    globalThis.fetch = originalFetch
  })

  globalThis.fetch = async () => {
    return new Response(
      JSON.stringify({
        status: 'fail',
        code: 'ERATELIMIT',
        message: 'Rate limit reached.',
        more: 'https://microlink.io/eratelimit',
        data: {
          url: 'Rate limit reached.'
        }
      }),
      {
        status: 429,
        headers: {
          'content-type': 'application/json; charset=utf-8'
        }
      }
    )
  }

  const result = await callMicrolink({
    params: {
      url: 'https://example.com',
      apiKey: 'pro-key'
    }
  })

  assert.equal(result.ok, false)
  assert.equal(result.statusCode, 429)
  assert.equal(result.endpoint, 'https://pro.microlink.io')
  assert.match(result.body.message, /^ERATELIMIT, Rate limit reached\.$/)
  assert.doesNotMatch(result.body.message, /50 requests\/day/)
  assert.doesNotMatch(result.body.message, /microlink\.io\/#pricing/)
})

test('coerces non-json responses into structured error payload', async t => {
  const originalFetch = globalThis.fetch

  t.after(() => {
    globalThis.fetch = originalFetch
  })

  globalThis.fetch = async () => {
    return new Response('<html>not json</html>', {
      status: 200,
      headers: {
        'content-type': 'text/html'
      }
    })
  }

  const result = await callMicrolink({
    params: {
      url: 'https://example.com'
    }
  })

  assert.equal(result.body.status, 'error')
  assert.match(result.body.message, /EFATALCLIENT/i)
  assert.match(result.body.message, /not valid JSON/i)
})
