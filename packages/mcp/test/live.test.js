import test from 'node:test'
import assert from 'node:assert/strict'

import { z } from 'zod'

import { tools } from '../src/tools/index.js'

// Opt-in live conformance tests: invoke real tools against the free Microlink
// endpoint and validate structuredContent against each tool's declared
// outputSchema. They catch contract drift between the schemas and the real
// API that unit tests with stubbed responses cannot.
//
// Run with: LIVE=1 pnpm test  (or: pnpm test:live)
// Without LIVE=1 every test in this file is skipped, so CI is unaffected.
const LIVE = process.env.LIVE === '1'
const run = { skip: !LIVE, timeout: 120000 }

const configs = {}
const handlers = {}
tools({
  registerTool: (name, config, handler) => {
    configs[name] = config
    handlers[name] = handler
  }
})

async function invoke (name, args) {
  const res = await handlers[name](args, {})
  assert.equal(res.isError, false, `${name} failed: ${res.content?.[0]?.text}`)
  const schema = z.object(configs[name].outputSchema)
  const parsed = schema.safeParse(res.structuredContent)
  assert.ok(parsed.success, `${name}: ${parsed.error?.message}`)
  return res.structuredContent.data
}

test('live: metadata matches its output schema', run, async () => {
  const data = await invoke('microlink_metadata', {
    url: 'https://example.com'
  })
  assert.equal(typeof data, 'object')
})

test('live: markdown matches its output schema', run, async () => {
  await invoke('microlink_markdown', { url: 'https://example.com' })
})

test('live: logo matches its output schema (asset or null)', run, async () => {
  await invoke('microlink_logo', { url: 'https://github.com' })
})

test('live: links matches its output schema', run, async () => {
  const data = await invoke('microlink_links', { url: 'https://example.com' })
  assert.ok(Array.isArray(data))
})

test('live: screenshot matches its output schema', run, async () => {
  const data = await invoke('microlink_screenshot', {
    url: 'https://example.com'
  })
  assert.equal(typeof data.url, 'string')
})

test('live: embed matches its output schema (embed or null)', run, async () => {
  await invoke('microlink_embed', {
    url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ'
  })
})

test('live: technologies matches its output schema', run, async () => {
  const data = await invoke('microlink_technologies', {
    url: 'https://example.com'
  })
  assert.ok(Array.isArray(data))
})

test('live: extract matches its output schema', run, async () => {
  await invoke('microlink_extract', {
    url: 'https://example.com',
    data: { title: { selector: 'h1' } }
  })
})
