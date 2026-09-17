import test from 'node:test'
import assert from 'node:assert/strict'

import { docs } from '../src/tools/docs.js'

function captureDocs () {
  let handler
  docs({
    registerTool: (_name, _config, registeredHandler) => {
      handler = registeredHandler
    }
  })
  return handler
}

function stubFetch (t, implementation) {
  const originalFetch = globalThis.fetch
  t.after(() => {
    globalThis.fetch = originalFetch
  })
  globalThis.fetch = implementation
}

test('microlink_docs returns the canonical product markdown', async t => {
  stubFetch(t, async (href, options) => {
    assert.equal(href, 'https://microlink.io/docs/sdk/methods/screenshot.md')
    assert.ok(options.signal instanceof AbortSignal)
    return new Response('# screenshot\n')
  })

  const result = await captureDocs()({ product: 'screenshot' }, {})

  assert.equal(result.isError, false)
  assert.equal(result.structuredContent.data, '# screenshot\n')
})

test('microlink_docs rejects unknown products with the valid choices', async () => {
  const result = await captureDocs()({ product: 'unknown' }, {})
  const error = JSON.parse(result.content[0].text)

  assert.equal(result.isError, true)
  assert.equal(result.structuredContent, undefined)
  assert.equal(error.message, 'Input validation failed.')
  assert.match(error.issues[0].message, /Unknown product/)
  assert.match(error.issues[0].message, /metadata/)
  assert.match(error.issues[0].message, /function/)
})

test('microlink_docs surfaces fetch failures', async t => {
  stubFetch(t, async () => {
    throw new Error('network unavailable')
  })

  const result = await captureDocs()({ product: 'markdown' }, {})
  const error = JSON.parse(result.content[0].text)

  assert.equal(result.isError, true)
  assert.equal(result.structuredContent, undefined)
  assert.equal(error.message, 'network unavailable')
})

test('microlink_docs surfaces HTTP fetch failures', async t => {
  stubFetch(t, async () => new Response('missing', { status: 404 }))

  const result = await captureDocs()({ product: 'markdown' }, {})
  const error = JSON.parse(result.content[0].text)

  assert.equal(result.isError, true)
  assert.equal(result.structuredContent, undefined)
  assert.match(error.message, /Failed to fetch/)
  assert.match(error.message, /404/)
})
