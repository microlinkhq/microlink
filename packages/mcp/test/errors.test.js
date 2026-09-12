import test from 'node:test'
import assert from 'node:assert/strict'

import { asErrorResult, MicrolinkError } from '../src/microlink-client.js'
import { metadata } from '../src/tools/metadata.js'

const GENERIC_API_MESSAGE =
  'The request has been not processed. See the errors above to know why.'

const PROXY_ERROR_BODY = {
  status: 'fail',
  data: {
    url: 'The URL `https://www.autoscout24.es/lst/volkswagen/golf` uses antibot protection. Upgrade to a PRO plan.'
  },
  more: 'https://microlink.io/eproxyneeded',
  code: 'EPROXYNEEDED',
  message: GENERIC_API_MESSAGE
}

const apiError = ({ statusCode = 400, ...body }) =>
  new MicrolinkError({
    ...body,
    statusCode,
    url: 'https://api.microlink.io/?url=https%3A%2F%2Fexample.com'
  })

test('EPROXYNEEDED explains the cause and how to continue', () => {
  const result = asErrorResult(apiError(PROXY_ERROR_BODY))
  const error = result.structuredContent.error

  assert.equal(result.isError, true)
  assert.equal(
    error.message,
    'The URL `https://www.autoscout24.es/lst/volkswagen/golf` uses antibot protection. Upgrade to a PRO plan.'
  )
  assert.equal(error.code, 'EPROXYNEEDED')
  assert.equal(error.status, 'fail')
  assert.equal(error.statusCode, 400)
  assert.equal(error.more, 'https://microlink.io/eproxyneeded')
  assert.deepEqual(error.details, PROXY_ERROR_BODY.data)

  // Structured fields so clients can react programmatically.
  assert.equal(error.reason, 'upgrade_required')
  assert.equal(error.capability, 'proxy')
  assert.deepEqual(error.upgrade, {
    plan: 'pro',
    url: 'https://microlink.io/#pricing'
  })

  // Agent-facing next step.
  assert.match(error.hint, /antibot protection/)
  assert.match(error.hint, /repeat the same call/)
  assert.match(error.hint, /apiKey/)
})

test('EINTEGRATION points to the PRO plan requirement', () => {
  const result = asErrorResult(
    apiError({
      status: 'fail',
      data: { url: 'You need a pro plan for using integrations.' },
      more: 'https://microlink.io/eintegration',
      code: 'EINTEGRATION',
      message: GENERIC_API_MESSAGE
    })
  )
  const error = result.structuredContent.error

  assert.equal(error.message, 'You need a pro plan for using integrations.')
  assert.equal(error.code, 'EINTEGRATION')
  assert.equal(error.reason, 'upgrade_required')
  assert.equal(error.capability, 'integration')
  assert.equal(error.upgrade.url, 'https://microlink.io/#pricing')
  assert.match(error.hint, /PRO plan/)
})

test('codes without guidance keep the specific message and no upgrade fields', () => {
  const result = asErrorResult(
    apiError({
      status: 'fail',
      data: {
        url: 'The URL `notaurl` is not valid. Ensure it has protocol, hostname and is reachable.'
      },
      code: 'EINVALURL',
      more: 'https://microlink.io/einvalurl',
      message: GENERIC_API_MESSAGE
    })
  )
  const error = result.structuredContent.error

  assert.equal(
    error.message,
    'The URL `notaurl` is not valid. Ensure it has protocol, hostname and is reachable.'
  )
  assert.equal(error.code, 'EINVALURL')
  assert.equal(error.reason, undefined)
  assert.equal(error.capability, undefined)
  assert.equal(error.upgrade, undefined)
  assert.equal(error.hint, undefined)
})

test('errors without data details keep the original message', () => {
  const result = asErrorResult(
    apiError({ status: 'fail', code: 'ETEST', message: 'boom' })
  )
  const error = result.structuredContent.error

  assert.equal(error.message, 'boom')
  assert.equal(error.details, undefined)
})

test('a specific API description wins over auxiliary data strings', () => {
  const result = asErrorResult(
    apiError({
      status: 'fail',
      data: { url: 'https://example.com' },
      code: 'EFATAL',
      message: 'The target URL is unreachable.'
    })
  )
  const error = result.structuredContent.error

  assert.equal(error.message, 'The target URL is unreachable.')
  assert.deepEqual(error.details, { url: 'https://example.com' })
})

test('non-Error thrown values fall back to String(error)', () => {
  const result = asErrorResult('plain failure')

  assert.equal(result.isError, true)
  assert.deepEqual(result.structuredContent.error, {
    message: 'plain failure'
  })
})

test('plain error payloads are wrapped without rewriting the message', () => {
  const payload = { message: 'Input validation failed.', issues: [] }
  const result = asErrorResult(payload)

  assert.equal(result.isError, true)
  assert.equal(result.structuredContent.error, payload)
  assert.deepEqual(JSON.parse(result.content[0].text), payload)
})

test('429 keeps the quota hint and exposes a machine-readable reason', () => {
  const result = asErrorResult(
    apiError({
      statusCode: 429,
      status: 'fail',
      code: 'ERATELIMIT',
      message: 'Rate limit exceeded.'
    })
  )
  const error = result.structuredContent.error

  assert.equal(error.message, 'Rate limit exceeded.')
  assert.equal(error.reason, 'quota_exceeded')
  assert.match(error.hint, /Free daily quota reached/)
  assert.match(error.hint, /https:\/\/microlink\.io\/#pricing/)
})

test('non-Microlink errors only expose the message', () => {
  const result = asErrorResult(new Error('fetch failed'))

  assert.equal(result.isError, true)
  assert.deepEqual(result.structuredContent.error, {
    message: 'fetch failed'
  })
})

test('the text content mirrors the structured error', () => {
  const result = asErrorResult(apiError(PROXY_ERROR_BODY))

  assert.equal(result.content.length, 1)
  assert.equal(result.content[0].type, 'text')
  assert.deepEqual(
    JSON.parse(result.content[0].text),
    result.structuredContent.error
  )
})

test('tool handlers surface actionable proxy errors end to end', async t => {
  const originalFetch = globalThis.fetch
  const originalEnvKey = process.env.MICROLINK_API_KEY

  t.after(() => {
    globalThis.fetch = originalFetch
    if (originalEnvKey === undefined) delete process.env.MICROLINK_API_KEY
    else process.env.MICROLINK_API_KEY = originalEnvKey
  })

  delete process.env.MICROLINK_API_KEY
  globalThis.fetch = async () =>
    new Response(JSON.stringify(PROXY_ERROR_BODY), {
      status: 400,
      headers: { 'content-type': 'application/json; charset=utf-8' }
    })

  const handlers = {}
  metadata({
    registerTool: (name, _config, handler) => {
      handlers[name] = handler
    }
  })

  const res = await handlers.microlink_metadata(
    { url: 'https://www.autoscout24.es/lst/volkswagen/golf' },
    {}
  )

  assert.equal(res.isError, true)
  assert.equal(res.structuredContent.error.code, 'EPROXYNEEDED')
  assert.equal(res.structuredContent.error.reason, 'upgrade_required')
  assert.match(res.structuredContent.error.message, /antibot protection/)
})
