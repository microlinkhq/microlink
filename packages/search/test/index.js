'use strict'

const { default: test } = require('ava')
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

test('omits page on the first request', async t => {
  const calls = []
  const google = createModule(mqlStub(calls))({})

  await google('test')

  const url = new URL(calls[0].url)
  t.is(url.searchParams.get('page'), null)
})

test('page option is forwarded', async t => {
  const calls = []
  const google = createModule(mqlStub(calls))({})

  await google('test', { page: 2 })

  const url = new URL(calls[0].url)
  t.is(url.searchParams.get('page'), '2')
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

test('next() requests page 2', async t => {
  const calls = []
  const google = createModule(mqlStub(calls))({})

  const page1 = await google('test')
  await page1.next()

  const url = new URL(calls[1].url)
  t.is(url.searchParams.get('page'), '2')
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

test('chained next() increments page', async t => {
  const calls = []
  const google = createModule(mqlStub(calls))({})

  const page1 = await google('test')
  const page2 = await page1.next()
  await page2.next()

  const url = new URL(calls[2].url)
  t.is(url.searchParams.get('page'), '3')
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

test('html: true resolves page and result html to strings', async t => {
  const calls = []
  const google = createModule(mqlStub(calls))({})

  const page = await google('test', { html: true })

  t.is(page.html, '<html>page</html>')
  t.is(page.results[0].html, '<html>page</html>')
  t.is(typeof page.next, 'function')
  t.is(calls[0].opts.html, undefined)
})

test('markdown: true resolves page and result markdown to strings', async t => {
  const calls = []
  const google = createModule(mqlStub(calls))({})

  const page = await google('test', { markdown: true })

  t.is(page.markdown, '# page')
  t.is(page.results[0].markdown, '# page')
  t.is(typeof page.next, 'function')
  t.is(calls[0].opts.markdown, undefined)
})

test('exposes the last mql response', async t => {
  const response = { headers: { 'content-length': '99' }, url: 'https://api' }
  const mqlFn = async () => ({
    data: { results: [] },
    response
  })
  const google = createModule(mqlFn)({})

  await google('test')

  t.is(google.last.response, response)
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

const heldLinkError = retryAfter =>
  Object.assign(new Error('EGOOGLELINK'), {
    code: 'EGOOGLELINK',
    headers: retryAfter === undefined ? {} : { 'retry-after': retryAfter }
  })

const SERP_URL = 'https://www.google.com/search?q=coffee'

const realSetTimeout = setTimeout
const settleTimers = () => new Promise(resolve => realSetTimeout(resolve, 50))

const googleAnswering = contentByUrl => {
  const calls = []
  const mqlFn = async (url, opts) => {
    if (!opts?.data) {
      return {
        data: {
          results: Object.keys(contentByUrl)
            .filter(u => u !== SERP_URL)
            .map(u => ({ url: u }))
        }
      }
    }
    calls.push(url)
    const queue = contentByUrl[url]
    const next = queue.length > 1 ? queue.shift() : queue[0]
    if (next instanceof Error) throw next
    return { data: { markdown: next, content: next } }
  }
  return { calls, google: createModule(mqlFn)({}) }
}

const recordWaits = t => {
  const waits = []
  const { setTimeout: originalSetTimeout } = global
  global.setTimeout = (fn, ms) => {
    waits.push(ms)
    return originalSetTimeout(fn, 0)
  }
  t.teardown(() => {
    global.setTimeout = originalSetTimeout
  })
  return waits
}

const HELD = 'https://www.google.com/goto?url=HELD'
const READY = 'https://www.google.com/goto?url=READY'

test.serial(
  'a held result is fetched again after the time the api asks for',
  async t => {
    const waits = recordWaits(t)
    const { calls, google } = googleAnswering({
      [HELD]: [heldLinkError('60'), '# destination']
    })

    const page = await google('coffee')

    t.is(await page.results[0].markdown(), '# destination')
    t.deepEqual(calls, [HELD, HELD])
    t.is(waits.length, 1)
    t.true(waits[0] >= 60000 && waits[0] <= 72000)
  }
)

for (const [retryAfter, min, max] of [
  [undefined, 60000, 72000],
  ['soon', 60000, 72000],
  ['-5', 0, 0],
  ['9999999', 120000, 120000]
]) {
  test.serial(
    `a retry-after of ${retryAfter} waits between ${min} and ${max}ms`,
    async t => {
      const waits = recordWaits(t)
      const { google } = googleAnswering({
        [HELD]: [heldLinkError(retryAfter), '# destination']
      })

      const page = await google('coffee')
      await page.results[0].html()

      t.true(waits[0] >= min && waits[0] <= max)
    }
  )
}

test.serial(
  'markdown: true resolves every result while google holds some',
  async t => {
    recordWaits(t)
    const { google } = googleAnswering({
      [SERP_URL]: ['# serp'],
      [HELD]: [heldLinkError('60'), '# held destination'],
      [READY]: ['# ready destination']
    })

    const page = await google('coffee', { markdown: true })

    t.is(page.markdown, '# serp')
    t.deepEqual(
      page.results.map(result => result.markdown),
      ['# held destination', '# ready destination']
    )
  }
)

test.serial('markdown: true sends nothing more once it has failed', async t => {
  recordWaits(t)
  const failure = Object.assign(new Error('EFATAL'), {
    code: 'EFATAL',
    headers: {}
  })
  const { calls, google } = googleAnswering({
    [SERP_URL]: ['# serp'],
    [READY]: [failure],
    [HELD]: [heldLinkError('60'), heldLinkError('60'), '# held destination']
  })

  await t.throwsAsync(google('coffee', { markdown: true }), { code: 'EFATAL' })
  const sent = calls.length
  await settleTimers()

  t.is(calls.length, sent)
})

test.serial(
  'a result google keeps holding fails after three attempts',
  async t => {
    recordWaits(t)
    const { calls, google } = googleAnswering({ [HELD]: [heldLinkError('60')] })

    const page = await google('coffee')

    await t.throwsAsync(page.results[0].html(), { code: 'EGOOGLELINK' })
    t.is(calls.length, 3)
  }
)

test('other failures are not retried', async t => {
  const failure = Object.assign(new Error('EFATAL'), {
    code: 'EFATAL',
    headers: {}
  })
  const { calls, google } = googleAnswering({ [HELD]: [failure] })

  const page = await google('coffee')

  await t.throwsAsync(page.results[0].markdown(), { code: 'EFATAL' })
  t.is(calls.length, 1)
})
