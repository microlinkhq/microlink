'use strict'

const test = require('ava')
const proxyquire = require('proxyquire').noCallThru()

const createModule = mqlFn => proxyquire('../src', { '@microlink/mql': mqlFn })

const mqlStub =
  (capturedCalls = []) =>
    async (url, opts) => {
      capturedCalls.push({ url, opts })
      if (opts && opts.data && opts.data.markdown) {
        return { data: { markdown: '# page' } }
      }
      if (opts && opts.data) {
        return { data: { content: '<html>page</html>' } }
      }
      return {
        data: {
          results: [
            { url: 'https://example.com/1', title: 'Result 1' },
            { url: 'https://example.com/2', title: 'Result 2' }
          ]
        }
      }
    }

test('starts pagination offset at 0', async t => {
  const calls = []
  const google = createModule(mqlStub(calls))({})

  await google('test')

  const url = new URL(calls[0].url)
  t.is(url.searchParams.get('start'), '0')
})

test('merges context opts with per-call opts', async t => {
  const calls = []
  const google = createModule(mqlStub(calls))({
    endpoint: 'https://custom.api'
  })

  await google('test', { timeout: 5000 })

  t.like(calls[0].opts, { endpoint: 'https://custom.api', timeout: 5000 })
})

test('per-call opts override context opts', async t => {
  const calls = []
  const google = createModule(mqlStub(calls))({ timeout: 1000 })

  await google('test', { timeout: 5000 })

  t.is(calls[0].opts.timeout, 5000)
})

test('returns mapped results with original properties', async t => {
  const google = createModule(mqlStub())({})

  const page = await google('test')

  t.is(page.results.length, 2)
  t.is(page.results[0].url, 'https://example.com/1')
  t.is(page.results[0].title, 'Result 1')
  t.is(page.results[1].url, 'https://example.com/2')
})

test('page html() fetches Google SERP HTML lazily', async t => {
  const calls = []
  const google = createModule(mqlStub(calls))({})

  const page = await google('test query')
  const html = await page.html()

  t.is(html, '<html>page</html>')
  t.is(calls[1].url, 'https://www.google.com/search?q=test%20query')
  t.deepEqual(calls[1].opts.data, { content: { attr: 'html' } })
})

test('result html() fetches content from result URL', async t => {
  const calls = []
  const mqlFn = async (url, opts) => {
    calls.push({ url, opts })
    if (opts && opts.data) {
      return { data: { content: '<div>article</div>' } }
    }
    return {
      data: {
        results: [{ url: 'https://example.com/article', title: 'Article' }]
      }
    }
  }
  const google = createModule(mqlFn)({})

  const page = await google('test')
  const html = await page.results[0].html()

  t.is(html, '<div>article</div>')
  t.is(calls[1].url, 'https://example.com/article')
  t.deepEqual(calls[1].opts.data, { content: { attr: 'html' } })
})

test('page markdown() fetches Google SERP markdown lazily', async t => {
  const calls = []
  const google = createModule(mqlStub(calls))({})

  const page = await google('test query')
  const markdown = await page.markdown()

  t.is(markdown, '# page')
  t.is(calls[1].url, 'https://www.google.com/search?q=test%20query')
  t.deepEqual(calls[1].opts.data, { markdown: { attr: 'markdown' } })
})

test('result markdown() fetches content from result URL', async t => {
  const calls = []
  const mqlFn = async (url, opts) => {
    calls.push({ url, opts })
    if (opts && opts.data && opts.data.markdown) {
      return { data: { markdown: '# article' } }
    }
    if (opts && opts.data) {
      return { data: { content: '<div>article</div>' } }
    }
    return {
      data: {
        results: [{ url: 'https://example.com/article', title: 'Article' }]
      }
    }
  }
  const google = createModule(mqlFn)({})

  const page = await google('test')
  const markdown = await page.results[0].markdown()

  t.is(markdown, '# article')
  t.is(calls[1].url, 'https://example.com/article')
  t.deepEqual(calls[1].opts.data, { markdown: { attr: 'markdown' } })
})

test('next() returns second page with correct offset', async t => {
  const calls = []
  const google = createModule(mqlStub(calls))({})

  const page1 = await google('test')
  await page1.next()

  const url = new URL(calls[1].url)
  t.is(url.searchParams.get('start'), '2')
})

test('next() preserves all URL params', async t => {
  const calls = []
  const google = createModule(mqlStub(calls))({})

  const page1 = await google('test', {
    period: 'week',
    location: 'fr',
    limit: 5
  })
  await page1.next()

  const url = new URL(calls[1].url)
  t.is(url.searchParams.get('period'), 'week')
  t.is(url.pathname, '/test/5/fr')
})

test('chained next() accumulates offset', async t => {
  const calls = []
  const google = createModule(mqlStub(calls))({})

  const page1 = await google('test')
  const page2 = await page1.next()
  await page2.next()

  const url = new URL(calls[2].url)
  t.is(url.searchParams.get('start'), '4')
})

test('type option sets type query param', async t => {
  const calls = []
  const google = createModule(mqlStub(calls))({})

  await google('test', { type: 'news' })

  const url = new URL(calls[0].url)
  t.is(url.searchParams.get('type'), 'news')
})

test('results with url field get html()', async t => {
  const calls = []
  const mqlFn = async (url, opts) => {
    calls.push({ url, opts })
    if (opts && opts.data) {
      return { data: { content: '<div>news</div>' } }
    }
    return {
      data: {
        results: [
          {
            title: 'News',
            url: 'https://example.com/news',
            description: 'text'
          }
        ]
      }
    }
  }
  const google = createModule(mqlFn)({})

  const page = await google('test', { type: 'news' })
  const html = await page.results[0].html()

  t.is(html, '<div>news</div>')
  t.is(calls[1].url, 'https://example.com/news')
})

test('results without link skip html()', async t => {
  const mqlFn = async () => ({
    data: {
      results: [{ value: 'suggestion' }]
    }
  })
  const google = createModule(mqlFn)({})

  const page = await google('test', { type: 'autocomplete' })

  t.is(page.results[0].value, 'suggestion')
  t.is(page.results[0].html, undefined)
  t.is(page.results[0].markdown, undefined)
})

test('extra data fields are forwarded to page', async t => {
  const mqlFn = async () => ({
    data: {
      results: [{ url: 'https://example.com', title: 'Test' }],
      knowledgeGraph: { title: 'Test', type: 'Thing' },
      peopleAlsoAsk: [{ question: 'What?' }]
    }
  })
  const google = createModule(mqlFn)({})

  const page = await google('test')

  t.deepEqual(page.knowledgeGraph, { title: 'Test', type: 'Thing' })
  t.deepEqual(page.peopleAlsoAsk, [{ question: 'What?' }])
})
