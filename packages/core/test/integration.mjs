import test from 'ava'

import create from '../src/main.mjs'

const { MICROLINK_API_KEY: apiKey } = process.env
const microlink = create(apiKey ? { apiKey } : {})

const targetUrl = 'https://example.com'

const isAbsolute = url => URL.canParse(url)

test('markdown returns a non-empty string', async t => {
  const markdown = await microlink.markdown(targetUrl)
  t.is(typeof markdown, 'string')
  t.true(markdown.length > 0)
})

test('screenshot returns the asset object', async t => {
  const screenshot = await microlink.screenshot(targetUrl)
  t.truthy(screenshot.url)
  t.true(screenshot.width > 0)
})

test('metadata has a title', async t => {
  const metadata = await microlink.metadata(targetUrl)
  t.is(typeof metadata.title, 'string')
  t.true(metadata.title.length > 0)
})

test('links returns deduped absolute URLs', async t => {
  const links = await microlink.links('https://microlink.io')
  t.true(Array.isArray(links))
  t.true(links.length > 0)
  t.true(links.every(isAbsolute))
  t.is(links.length, new Set(links).size)
})

test('images returns resolved URLs', async t => {
  const images = await microlink.images('https://microlink.io')
  t.true(Array.isArray(images))
  t.true(images.length > 0)
  t.true(images.every(url => /^(https?:|data:)/.test(url)))
})

// TODO: unskip once the live API reliably returns a video for this URL
test.skip('video detects the primary video', async t => {
  const video = await microlink.video('https://vimeo.com/76979871')
  t.truthy(video.url)
  t.is(typeof video.url, 'string')
})

test('function runs code remotely with injected scope variables', async t => {
  const { isFulfilled, value } = await microlink.run(
    targetUrl,
    ({ page, selector }) => page.$eval(selector, el => el.textContent),
    { selector: 'h1' }
  )
  t.true(isFulfilled)
  t.is(value, 'Example Domain')
})

test('emails returns the addresses present on the page', async t => {
  const emails = await microlink.emails('https://microlink.io')
  t.true(Array.isArray(emails))
  t.true(emails.includes('hello@microlink.io'))
})

test('extract runs custom data rules end-to-end', async t => {
  const { image } = await microlink.extract('https://microlink.io', {
    image: {
      selector: 'meta[property="og:image"]',
      attr: 'content',
      type: 'image'
    }
  })
  t.truthy(image.url)
  t.truthy(image.size_pretty)
})
