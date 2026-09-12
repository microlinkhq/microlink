import test from 'node:test'
import assert from 'node:assert/strict'

import { z } from 'zod'

import { tools } from '../src/tools/index.js'
import { outputSchemas } from '../src/output-schemas.js'

function captureAll () {
  const registered = {}
  tools({
    registerTool: (name, config, handler) => {
      registered[name] = { config, handler }
    }
  })
  return registered
}

const registered = captureAll()
const toolNames = Object.keys(registered)

function dataSchema (toolName) {
  const { outputSchema } = registered[toolName].config
  assert.ok(outputSchema?.data, `${toolName} declares an output schema`)
  return z.object(outputSchema)
}

test('every tool declares an output schema', () => {
  assert.equal(toolNames.length, Object.keys(outputSchemas).length)
  for (const name of toolNames) dataSchema(name)
})

test('metadata validates a live-shaped payload with null media', () => {
  const schema = dataSchema('microlink_metadata')
  const result = schema.safeParse({
    data: {
      title: 'Example Domain',
      description: null,
      url: 'https://example.com',
      lang: 'en',
      author: null,
      publisher: 'IANA',
      date: '2026-09-12T00:00:00.000Z',
      image: null,
      logo: null
    }
  })
  assert.ok(result.success, result.error?.message)
})

test('logo, video and audio validate a null asset', () => {
  for (const name of ['microlink_logo', 'microlink_video', 'microlink_audio']) {
    const result = dataSchema(name).safeParse({ data: null })
    assert.ok(result.success, `${name}: ${result.error?.message}`)
  }
})

test('asset tools validate a rich asset with extra API fields', () => {
  for (const name of ['microlink_screenshot', 'microlink_pdf']) {
    const result = dataSchema(name).safeParse({
      data: {
        url: 'https://cdn.microlink.io/file.png',
        type: 'png',
        size: 12345,
        size_pretty: '12.3 kB',
        width: 1280,
        height: 800,
        // Forward-compatible field not present in the type definitions.
        palette: ['#fff']
      }
    })
    assert.ok(result.success, `${name}: ${result.error?.message}`)
  }
})

test('content tools validate strings', () => {
  for (const name of [
    'microlink_markdown',
    'microlink_html',
    'microlink_text'
  ]) {
    assert.ok(dataSchema(name).safeParse({ data: '# Hello' }).success)
  }
})

test('collection tools validate string arrays', () => {
  for (const name of [
    'microlink_links',
    'microlink_images',
    'microlink_videos',
    'microlink_audios',
    'microlink_emails'
  ]) {
    assert.ok(dataSchema(name).safeParse({ data: [] }).success)
    assert.ok(
      dataSchema(name).safeParse({ data: ['https://example.com/a'] }).success
    )
  }
})

test('embed validates html plus scripts', () => {
  const result = dataSchema('microlink_embed').safeParse({
    data: {
      html: '<iframe></iframe>',
      scripts: ['https://cdn.example.com/x.js']
    }
  })
  assert.ok(result.success, result.error?.message)
})

test('embed validates a null iframe when oEmbed finds nothing', () => {
  assert.ok(dataSchema('microlink_embed').safeParse({ data: null }).success)
})

test('technologies validates an array, lighthouse and extract objects', () => {
  assert.ok(
    dataSchema('microlink_technologies').safeParse({ data: [] }).success
  )
  assert.ok(
    dataSchema('microlink_lighthouse').safeParse({ data: { version: '12' } })
      .success
  )
  assert.ok(
    dataSchema('microlink_lighthouse').safeParse({
      data: '<html><body>report</body></html>'
    }).success
  )
  assert.ok(
    dataSchema('microlink_extract').safeParse({ data: { avatar: 'x' } }).success
  )
})

test('function validates FunctionResult without profiling/logging', () => {
  const result = dataSchema('microlink_function').safeParse({
    data: { isFulfilled: true, value: 42 }
  })
  assert.ok(result.success, result.error?.message)
})

test('search validates web, news and autocomplete projections', () => {
  const schema = dataSchema('microlink_search')
  assert.ok(
    schema.safeParse({
      data: {
        results: [
          { title: 'Coffee', url: 'https://example.com', description: '...' }
        ],
        knowledgeGraph: { title: 'Coffee' },
        peopleAlsoAsk: [{ question: 'What is coffee?' }],
        relatedSearches: [{ query: 'tea' }]
      }
    }).success
  )
  assert.ok(
    schema.safeParse({
      data: {
        results: [
          {
            title: 'News',
            url: 'https://example.com/n',
            description: '...',
            date: '2026-09-12',
            publisher: 'Example'
          }
        ]
      }
    }).success
  )
  assert.ok(
    schema.safeParse({ data: { results: [{ value: 'coffee' }] } }).success
  )
})

test('error results are exempt from output validation by SDK contract', () => {
  // The MCP SDK skips outputSchema validation when `isError` is true, and
  // error results carry `structuredContent.error`, never `data`. Assert the
  // registered handlers keep that split: an error payload must NOT match the
  // success schema, proving the exemption is load-bearing.
  const schema = dataSchema('microlink_metadata')
  assert.equal(schema.safeParse({ error: { message: 'boom' } }).success, false)
})
