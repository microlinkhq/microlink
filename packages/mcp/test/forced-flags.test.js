import test from 'node:test'
import assert from 'node:assert/strict'

import { meta } from '../src/tools/meta.js'
import { audio } from '../src/tools/audio.js'
import { palette } from '../src/tools/palette.js'

// Capture the handler each tool registers so we can invoke it directly, then
// stub `fetch` to inspect the request the handler builds against Microlink.
function captureTool (registerTool) {
  const handlers = {}
  const server = {
    registerTool (name, _config, handler) {
      handlers[name] = handler
    }
  }
  registerTool(server)
  return handlers
}

function withStubbedRequest (t, run) {
  const originalFetch = globalThis.fetch
  const originalEnvKey = process.env.MICROLINK_API_KEY

  t.after(() => {
    globalThis.fetch = originalFetch
    if (originalEnvKey === undefined) delete process.env.MICROLINK_API_KEY
    else process.env.MICROLINK_API_KEY = originalEnvKey
  })

  delete process.env.MICROLINK_API_KEY

  let requestUrl
  globalThis.fetch = async input => {
    requestUrl = new URL(input instanceof Request ? input.url : input)
    return new Response(JSON.stringify({ status: 'success', data: {} }), {
      status: 200,
      headers: { 'content-type': 'application/json; charset=utf-8' }
    })
  }

  return run(() => requestUrl)
}

// Finding #3: the meta tool advertises `meta: false` but used to force
// `meta: true`, so the documented skip never happened. It must flow through.
test('microlink_meta lets `meta: false` skip metadata extraction', async t => {
  const handlers = captureTool(meta)

  await withStubbedRequest(t, async getUrl => {
    await handlers.microlink_meta(
      { url: 'https://example.com', meta: false },
      {}
    )
    assert.equal(getUrl().searchParams.get('meta'), 'false')
  })
})

// Guard against regressing findings #1/#2: a dedicated tool can't be disabled
// by its own input — a bare `audio: false` is overridden by the forced flag.
test('microlink_audio keeps its forced capability against `audio: false`', async t => {
  const handlers = captureTool(audio)

  await withStubbedRequest(t, async getUrl => {
    await handlers.microlink_audio(
      { url: 'https://example.com', audio: false },
      {}
    )
    assert.equal(getUrl().searchParams.get('audio'), 'true')
    assert.equal(getUrl().searchParams.get('meta'), 'false')
  })
})

// Same class as the meta tool: the palette tool advertises `meta: false` but
// used to force `meta: true`. Its own capability stays forced; `meta` flows.
test('microlink_palette keeps `palette` forced but lets `meta: false` through', async t => {
  const handlers = captureTool(palette)

  await withStubbedRequest(t, async getUrl => {
    await handlers.microlink_palette(
      { url: 'https://example.com', palette: false, meta: false },
      {}
    )
    assert.equal(getUrl().searchParams.get('palette'), 'true')
    assert.equal(getUrl().searchParams.get('meta'), 'false')
  })
})
