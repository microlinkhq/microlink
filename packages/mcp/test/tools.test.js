import test from 'node:test'
import assert from 'node:assert/strict'

import { metadata } from '../src/tools/metadata.js'
import { logo } from '../src/tools/logo.js'
import { markdown } from '../src/tools/markdown.js'
import { screenshot } from '../src/tools/screenshot.js'
import { pdf } from '../src/tools/pdf.js'
import { audio } from '../src/tools/audio.js'
import { links } from '../src/tools/links.js'
import { technologies } from '../src/tools/technologies.js'
import { lighthouse } from '../src/tools/lighthouse.js'
import { embed } from '../src/tools/embed.js'
import { search } from '../src/tools/search.js'
import { fn } from '../src/tools/function.js'

// Capture the handler each tool registers so we can invoke it directly, then
// stub `fetch` to inspect the request the tool builds via the microlink.io
// library and the tool result it returns.
function captureTool (registerTool) {
  const handlers = {}
  registerTool({
    registerTool: (name, _config, handler) => {
      handlers[name] = handler
    }
  })
  return handlers
}

function withStubbedRequest (t, run, { data = {}, status = 200 } = {}) {
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
    const body =
      status === 200
        ? { status: 'success', data }
        : { status: 'fail', code: 'ETEST', message: 'boom' }
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json; charset=utf-8' }
    })
  }

  return run(() => requestUrl)
}

test('microlink_metadata forwards `meta: false` and returns the data object', async t => {
  const handlers = captureTool(metadata)
  await withStubbedRequest(
    t,
    async getUrl => {
      const res = await handlers.microlink_metadata(
        { url: 'https://example.com', meta: false },
        {}
      )
      assert.equal(getUrl().searchParams.get('meta'), 'false')
      assert.deepEqual(res.structuredContent.data, { title: 'Example' })
      assert.ok(!res.isError)
    },
    { data: { title: 'Example' } }
  )
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

test('microlink_markdown scopes to `selector` and returns a string', async t => {
  const handlers = captureTool(markdown)
  await withStubbedRequest(
    t,
    async getUrl => {
      const res = await handlers.microlink_markdown(
        { url: 'https://example.com', selector: 'article' },
        {}
      )
      assert.equal(
        getUrl().searchParams.get('data.markdown.selector'),
        'article'
      )
      assert.equal(getUrl().searchParams.get('data.markdown.attr'), 'markdown')
      assert.equal(res.structuredContent.data, '# Hello')
    },
    { data: { markdown: '# Hello' } }
  )
})

test('microlink_screenshot nests config (animated) and keeps device top-level', async t => {
  const handlers = captureTool(screenshot)
  await withStubbedRequest(
    t,
    async getUrl => {
      const res = await handlers.microlink_screenshot(
        {
          url: 'https://example.com',
          screenshot: { animated: true, fullPage: true },
          device: 'iPhone 11'
        },
        {}
      )
      const q = getUrl().searchParams
      assert.equal(q.get('screenshot.animated'), 'true')
      assert.equal(q.get('screenshot.fullPage'), 'true')
      assert.equal(q.get('device'), 'iPhone 11')
      assert.equal(q.get('meta'), 'false')
      assert.equal(res.structuredContent.data.url, 'https://cdn/x.png')
    },
    { data: { screenshot: { url: 'https://cdn/x.png', type: 'png' } } }
  )
})

test('microlink_pdf nests config', async t => {
  const handlers = captureTool(pdf)
  await withStubbedRequest(t, async getUrl => {
    await handlers.microlink_pdf(
      { url: 'https://example.com', pdf: { format: 'A4' } },
      {}
    )
    assert.equal(getUrl().searchParams.get('pdf.format'), 'A4')
  })
})

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

test('microlink_links forces the links data rule', async t => {
  const handlers = captureTool(links)
  await withStubbedRequest(t, async getUrl => {
    await handlers.microlink_links({ url: 'https://example.com' }, {})
    const q = getUrl().searchParams
    assert.equal(q.get('data.links.selectorAll'), 'a')
    assert.equal(q.get('data.links.attr'), 'href')
    assert.equal(q.get('data.links.type'), 'url')
  })
})

test('microlink_technologies and microlink_lighthouse scope insights', async t => {
  const techHandlers = captureTool(technologies)
  const lhHandlers = captureTool(lighthouse)
  await withStubbedRequest(t, async getUrl => {
    await techHandlers.microlink_technologies(
      { url: 'https://example.com' },
      {}
    )
    assert.equal(getUrl().searchParams.get('insights.technologies'), 'true')
    assert.equal(getUrl().searchParams.get('insights.lighthouse'), 'false')

    await lhHandlers.microlink_lighthouse({ url: 'https://example.com' }, {})
    assert.equal(getUrl().searchParams.get('insights.lighthouse'), 'true')
    assert.equal(getUrl().searchParams.get('insights.technologies'), 'false')
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

test('microlink_search builds a Google query request', async t => {
  const handlers = captureTool(search)
  await withStubbedRequest(
    t,
    async getUrl => {
      const res = await handlers.microlink_search(
        { query: 'lotus elise', limit: 5 },
        {}
      )
      const target = getUrl().searchParams.get('url')
      assert.match(target, /microlink\.google/)
      assert.match(target, /lotus\+elise/)
      assert.ok(Array.isArray(res.structuredContent.data.results))
    },
    { data: { results: [] } }
  )
})

test('microlink_function sends the function param and returns its value', async t => {
  const handlers = captureTool(fn)
  await withStubbedRequest(
    t,
    async getUrl => {
      const res = await handlers.microlink_function(
        { url: 'https://example.com', code: '() => 42' },
        {}
      )
      assert.ok(getUrl().searchParams.get('function'))
      assert.equal(res.structuredContent.data.value, 42)
    },
    { data: { function: { isFulfilled: true, value: 42 } } }
  )
})

test('errors are surfaced as MCP isError with code/message', async t => {
  const handlers = captureTool(metadata)
  await withStubbedRequest(
    t,
    async () => {
      const res = await handlers.microlink_metadata(
        { url: 'https://example.com' },
        {}
      )
      assert.equal(res.isError, true)
      assert.ok(res.structuredContent.error.message)
    },
    { status: 400 }
  )
})
