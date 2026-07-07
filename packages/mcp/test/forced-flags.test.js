import test from 'node:test'
import assert from 'node:assert/strict'

import { metadata } from '../src/tools/metadata.js'
import { audio } from '../src/tools/audio.js'
import { logo } from '../src/tools/logo.js'
import { links } from '../src/tools/links.js'
import { technologies } from '../src/tools/technologies.js'
import { lighthouse } from '../src/tools/lighthouse.js'
import { embed } from '../src/tools/embed.js'

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

// Finding #3: the metadata tool advertises `meta: false` but used to force
// `meta: true`, so the documented skip never happened. It must flow through.
test('microlink_metadata lets `meta: false` skip metadata extraction', async t => {
  const handlers = captureTool(metadata)

  await withStubbedRequest(t, async getUrl => {
    await handlers.microlink_metadata(
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

// microlink_logo mirrors microlink.logo: metadata on by default, and `square`
// scopes it to `meta.logo.square` (not a bare top-level `square` param).
test('microlink_logo requests metadata by default', async t => {
  const handlers = captureTool(logo)

  await withStubbedRequest(t, async getUrl => {
    await handlers.microlink_logo({ url: 'https://example.com' }, {})
    assert.equal(getUrl().searchParams.get('meta'), 'true')
  })
})

test('microlink_logo maps `square` to meta.logo.square', async t => {
  const handlers = captureTool(logo)

  await withStubbedRequest(t, async getUrl => {
    await handlers.microlink_logo(
      { url: 'https://example.com', square: true },
      {}
    )
    assert.equal(getUrl().searchParams.get('meta.logo.square'), 'true')
    assert.equal(getUrl().searchParams.get('square'), null)
  })
})

// Library-aligned tools serialize the right forced Microlink params.
test('microlink_links forces the links data rule', async t => {
  const handlers = captureTool(links)

  await withStubbedRequest(t, async getUrl => {
    await handlers.microlink_links({ url: 'https://example.com' }, {})
    const q = getUrl().searchParams
    assert.equal(q.get('data.links.selectorAll'), 'a')
    assert.equal(q.get('data.links.attr'), 'href')
    assert.equal(q.get('data.links.type'), 'url')
    assert.equal(q.get('meta'), 'false')
  })
})

test('microlink_technologies scopes insights to technologies', async t => {
  const handlers = captureTool(technologies)

  await withStubbedRequest(t, async getUrl => {
    await handlers.microlink_technologies({ url: 'https://example.com' }, {})
    const q = getUrl().searchParams
    assert.equal(q.get('insights.technologies'), 'true')
    assert.equal(q.get('insights.lighthouse'), 'false')
  })
})

test('microlink_lighthouse scopes insights to lighthouse', async t => {
  const handlers = captureTool(lighthouse)

  await withStubbedRequest(t, async getUrl => {
    await handlers.microlink_lighthouse({ url: 'https://example.com' }, {})
    const q = getUrl().searchParams
    assert.equal(q.get('insights.lighthouse'), 'true')
    assert.equal(q.get('insights.technologies'), 'false')
  })
})

test('microlink_embed forces the iframe capability', async t => {
  const handlers = captureTool(embed)

  await withStubbedRequest(t, async getUrl => {
    await handlers.microlink_embed({ url: 'https://example.com' }, {})
    assert.equal(getUrl().searchParams.get('iframe'), 'true')
    assert.equal(getUrl().searchParams.get('meta'), 'false')
  })
})
