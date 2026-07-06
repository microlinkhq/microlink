import { createRequire } from 'module'
import test from 'ava'

const require = createRequire(import.meta.url)
const proxyquire = require('proxyquire')

const DATA = {
  title: 'Example Domain',
  markdown: '# Example',
  html: '<a href="mailto:hello@example.com">hello@example.com</a> <img src="logo@2x.png"> sales@example.com',
  text: 'Example',
  logo: { url: 'https://example.com/logo.png', type: 'png' },
  screenshot: { url: 'https://example.com/shot.png', width: 1280 },
  pdf: { url: 'https://example.com/file.pdf', type: 'pdf' },
  iframe: { html: '<iframe></iframe>', scripts: [] },
  insights: { technologies: ['react'], lighthouse: { performance: 1 } },
  links: ['https://example.com/'],
  images: ['https://example.com/image.png'],
  video: { url: 'https://example.com/video.mp4', type: 'mp4' },
  audio: { url: 'https://example.com/audio.mp3', type: 'mp3' },
  videos: ['https://example.com/video.mp4'],
  audios: ['https://example.com/audio.mp3'],
  avatar: { url: 'https://example.com/avatar.png' }
}

const setup = () => {
  const calls = []
  const mqlStub = (url, mqlOpts, gotOpts) => {
    calls.push({ url, mqlOpts, gotOpts })
    return Promise.resolve({ status: 'success', data: DATA })
  }
  mqlStub.MicrolinkError = class MicrolinkError extends Error {}

  const fnCalls = []
  const fnStub = (code, mqlOpts, gotOpts) => {
    fnCalls.push({ code, mqlOpts, gotOpts })
    return url => Promise.resolve({ isFulfilled: true, value: url })
  }

  const googleCalls = []
  const googleStub = ctx => (query, opts) => {
    googleCalls.push({ ctx, query, opts })
    return Promise.resolve({ results: [] })
  }

  const create = proxyquire('../src/index.js', {
    '@microlink/mql': mqlStub,
    '@microlink/function': fnStub,
    '@microlink/google': googleStub
  })

  return { create, calls, fnCalls, googleCalls }
}

const URL = 'https://example.com'

test('markdown sets the data rule and unwraps the field', async t => {
  const { create, calls } = setup()
  const result = await create().markdown(URL)
  t.is(result, '# Example')
  t.deepEqual(calls[0].mqlOpts, {
    meta: false,
    data: { markdown: { attr: 'markdown' } }
  })
  t.is(calls[0].gotOpts, undefined)
})

test('html/text share the content preset', async t => {
  const { create, calls } = setup()
  const client = create()
  t.is(await client.html(URL), DATA.html)
  t.is(await client.text(URL), DATA.text)
  t.deepEqual(calls[0].mqlOpts.data, { html: { attr: 'html' } })
  t.deepEqual(calls[1].mqlOpts.data, { text: { attr: 'text' } })
})

test('content sub-options nest into the rule', async t => {
  const { create, calls } = setup()
  await create().markdown(URL, { selector: 'article' })
  t.deepEqual(calls[0].mqlOpts.data, {
    markdown: { attr: 'markdown', selector: 'article' }
  })
})

test('headers are routed to the HTTP layer, never the query string', async t => {
  const { create, calls } = setup()
  const headers = { 'x-api-header-cookie': 'auth=1' }
  await create().markdown(URL, { headers })
  t.deepEqual(calls[0].gotOpts, { headers })
  t.false('headers' in calls[0].mqlOpts)
})

test('screenshot routes nested vs top-level keys', async t => {
  const { create, calls } = setup()
  const result = await create().screenshot(URL, {
    fullPage: true,
    device: 'iPhone 11'
  })
  t.deepEqual(result, DATA.screenshot)
  t.deepEqual(calls[0].mqlOpts, {
    meta: false,
    device: 'iPhone 11',
    screenshot: { fullPage: true }
  })
})

test('screenshot without sub-options sends `screenshot: true`', async t => {
  const { create, calls } = setup()
  await create().screenshot(URL)
  t.is(calls[0].mqlOpts.screenshot, true)
})

test('pdf nests its capability keys', async t => {
  const { create, calls } = setup()
  const result = await create().pdf(URL, { format: 'A4' })
  t.deepEqual(result, DATA.pdf)
  t.deepEqual(calls[0].mqlOpts, {
    meta: false,
    pdf: { format: 'A4' }
  })
})

test('metadata returns the full data object', async t => {
  const { create, calls } = setup()
  const result = await create().metadata(URL)
  t.deepEqual(result, DATA)
  t.false('meta' in calls[0].mqlOpts)
})

test('logo unwraps data.logo and supports `square`', async t => {
  const { create, calls } = setup()
  const client = create()
  t.deepEqual(await client.logo(URL), DATA.logo)
  t.is(calls[0].mqlOpts.meta, true)
  await client.logo(URL, { square: true })
  t.deepEqual(calls[1].mqlOpts.meta, { logo: { square: true } })
})

test('embed uses the iframe param and unwraps data.iframe', async t => {
  const { create, calls } = setup()
  const client = create()
  t.deepEqual(await client.embed(URL), DATA.iframe)
  t.deepEqual(calls[0].mqlOpts, { meta: false, iframe: true })
  await client.embed(URL, { maxWidth: 500 })
  t.deepEqual(calls[1].mqlOpts.iframe, { maxWidth: 500 })
})

test('technologies disables lighthouse and unwraps the array', async t => {
  const { create, calls } = setup()
  const result = await create().technologies(URL)
  t.deepEqual(result, ['react'])
  t.deepEqual(calls[0].mqlOpts, {
    meta: false,
    insights: { technologies: true, lighthouse: false }
  })
})

test('lighthouse disables technologies and unwraps the report', async t => {
  const { create, calls } = setup()
  const result = await create().lighthouse(URL, {
    onlyCategories: ['performance']
  })
  t.deepEqual(result, { performance: 1 })
  t.deepEqual(calls[0].mqlOpts.insights, {
    technologies: false,
    lighthouse: { onlyCategories: ['performance'] }
  })
})

test('video/audio detect the primary media and unwrap the field', async t => {
  const { create, calls } = setup()
  const client = create()
  t.deepEqual(await client.video(URL), DATA.video)
  t.deepEqual(calls[0].mqlOpts, { meta: false, video: true })
  t.deepEqual(await client.audio(URL), DATA.audio)
  t.deepEqual(calls[1].mqlOpts, { meta: false, audio: true })
})

test('emails extracts deduped addresses from the page html', async t => {
  const { create, calls } = setup()
  const emails = await create().emails(URL)
  t.deepEqual(emails, ['hello@example.com', 'sales@example.com'])
  t.deepEqual(calls[0].mqlOpts, {
    meta: false,
    data: { html: { attr: 'html' } }
  })
})

test('collections set the right default rules', async t => {
  const { create, calls } = setup()
  const client = create()
  t.deepEqual(await client.links(URL), DATA.links)
  t.deepEqual(await client.images(URL), DATA.images)
  t.deepEqual(await client.videos(URL), DATA.videos)
  t.deepEqual(await client.audios(URL), DATA.audios)
  t.deepEqual(calls[0].mqlOpts.data, {
    links: { selectorAll: 'a', attr: 'href', type: 'url' }
  })
  t.deepEqual(calls[1].mqlOpts.data, {
    images: { selectorAll: 'img', attr: 'src', type: 'url' }
  })
  t.deepEqual(calls[2].mqlOpts.data, {
    videos: {
      selectorAll: ['video[src]', 'video source[src]'],
      attr: 'src',
      type: 'url'
    }
  })
  t.deepEqual(calls[3].mqlOpts.data, {
    audios: {
      selectorAll: ['audio[src]', 'audio source[src]'],
      attr: 'src',
      type: 'url'
    }
  })
})

test('collection sub-options override the default rule', async t => {
  const { create, calls } = setup()
  await create().links(URL, { selectorAll: 'nav a' })
  t.deepEqual(calls[0].mqlOpts.data, {
    links: { selectorAll: 'nav a', attr: 'href', type: 'url' }
  })
})

test('extract passes the rules verbatim and returns the full data', async t => {
  const { create, calls } = setup()
  const rules = { avatar: { selector: 'img', attr: 'src', type: 'image' } }
  const result = await create().extract(URL, rules)
  t.deepEqual(result, DATA)
  t.deepEqual(calls[0].mqlOpts, { meta: false, data: rules })
})

test('factory context is threaded into every call', async t => {
  const { create, calls } = setup()
  await create({ apiKey: 'secret' }).markdown(URL)
  t.is(calls[0].mqlOpts.apiKey, 'secret')
})

test('per-call options override the factory context', async t => {
  const { create, calls } = setup()
  await create({ apiKey: 'secret' }).markdown(URL, { apiKey: 'override' })
  t.is(calls[0].mqlOpts.apiKey, 'override')
})

test('function/run are the same method', async t => {
  const { create, fnCalls } = setup()
  const client = create({ apiKey: 'secret' })
  t.is(client.function, client.run)
  const code = '({ page }) => page.title()'
  const result = await client.run(URL, code, {
    headers: { 'x-foo': 'bar' }
  })
  t.deepEqual(result, { isFulfilled: true, value: URL })
  t.is(fnCalls[0].code, code)
  t.deepEqual(fnCalls[0].mqlOpts, { apiKey: 'secret' })
  t.deepEqual(fnCalls[0].gotOpts, { headers: { 'x-foo': 'bar' } })
})

test('search delegates to @microlink/google with the routed options', async t => {
  const { create, googleCalls } = setup()
  const client = create({ apiKey: 'secret', headers: { 'x-foo': 'bar' } })
  await client.search('coffee', { limit: 3 })
  t.is(googleCalls[0].query, 'coffee')
  t.deepEqual(googleCalls[0].opts, { apiKey: 'secret', limit: 3 })
})

test('MicrolinkError is re-exported', async t => {
  const { create } = setup()
  t.is(typeof create.MicrolinkError, 'function')
})
