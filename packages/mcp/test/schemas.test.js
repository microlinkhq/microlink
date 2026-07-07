import test from 'node:test'
import assert from 'node:assert/strict'

import {
  audioInputSchema,
  extractInputSchema,
  markdownInputSchema,
  metadataInputSchema,
  logoInputSchema,
  pdfInputSchema,
  screenshotInputSchema,
  textInputSchema,
  videoInputSchema
} from '../src/schemas.js'

test('extract schema accepts minimal valid payload', () => {
  const result = extractInputSchema.safeParse({
    url: 'https://microlink.io'
  })

  assert.equal(result.success, true)
})

test('extract schema rejects unknown top-level keys', () => {
  const result = extractInputSchema.safeParse({
    url: 'https://microlink.io',
    unknownParam: true
  })

  assert.equal(result.success, false)
  assert.match(
    result.error.issues[0].message,
    /Unrecognized key|unrecognized key/i
  )
})

test('screenshot schema rejects invalid screenshot type', () => {
  const result = screenshotInputSchema.safeParse({
    url: 'https://microlink.io',
    screenshot: {
      type: 'webp'
    }
  })

  assert.equal(result.success, false)
})

test('screenshot schema rejects unknown nested screenshot keys', () => {
  const result = screenshotInputSchema.safeParse({
    url: 'https://microlink.io',
    screenshot: {
      fullPage: true,
      randomExtraKey: 'nope'
    }
  })

  assert.equal(result.success, false)
})

test('screenshot schema accepts boolean toggle', () => {
  const result = screenshotInputSchema.safeParse({
    url: 'https://microlink.io',
    screenshot: true
  })

  assert.equal(result.success, true)
})

test('screenshot schema coerces string booleans for toggle and nested options', () => {
  const result = screenshotInputSchema.safeParse({
    url: 'https://microlink.io',
    screenshot: {
      fullPage: 'true',
      omitBackground: 'false'
    }
  })

  assert.equal(result.success, true)
  assert.equal(result.data.screenshot.fullPage, true)
  assert.equal(result.data.screenshot.omitBackground, false)
})

test('screenshot schema coerces string toggle value', () => {
  const result = screenshotInputSchema.safeParse({
    url: 'https://microlink.io',
    screenshot: 'true'
  })

  assert.equal(result.success, true)
  assert.equal(result.data.screenshot, true)
})

test('screenshot schema parses stringified object config', () => {
  const result = screenshotInputSchema.safeParse({
    url: 'https://microlink.io',
    screenshot: '{"overlay":{"browser":"dark"},"fullPage":"true"}'
  })

  assert.equal(result.success, true)
  assert.equal(result.data.screenshot.overlay.browser, 'dark')
  assert.equal(result.data.screenshot.fullPage, true)
})

test('pdf schema rejects scale values out of allowed range', () => {
  const result = pdfInputSchema.safeParse({
    url: 'https://microlink.io',
    pdf: {
      scale: 3
    }
  })

  assert.equal(result.success, false)
})

test('pdf schema accepts boolean toggle', () => {
  const result = pdfInputSchema.safeParse({
    url: 'https://microlink.io',
    pdf: true
  })

  assert.equal(result.success, true)
})

test('pdf schema coerces string boolean landscape value', () => {
  const result = pdfInputSchema.safeParse({
    url: 'https://microlink.io',
    pdf: {
      landscape: 'true'
    }
  })

  assert.equal(result.success, true)
  assert.equal(result.data.pdf.landscape, true)
})

test('pdf schema coerces string toggle value', () => {
  const result = pdfInputSchema.safeParse({
    url: 'https://microlink.io',
    pdf: 'true'
  })

  assert.equal(result.success, true)
  assert.equal(result.data.pdf, true)
})

test('pdf schema parses stringified object config', () => {
  const result = pdfInputSchema.safeParse({
    url: 'https://microlink.io',
    pdf: '{"landscape":"true","margin":{"top":"1cm"}}'
  })

  assert.equal(result.success, true)
  assert.equal(result.data.pdf.landscape, true)
  assert.equal(result.data.pdf.margin.top, '1cm')
})

test('data schema accepts a valid single rule object', () => {
  const result = extractInputSchema.safeParse({
    url: 'https://microlink.io',
    data: {
      price: { selector: '.price', type: 'number' },
      title: { selector: 'h1', attr: 'text' }
    }
  })

  assert.equal(result.success, true)
})

test('data schema accepts an array of fallback rule objects', () => {
  const result = extractInputSchema.safeParse({
    url: 'https://microlink.io',
    data: {
      price: [
        { selector: '.price-new', type: 'number' },
        { selector: '.price-old', type: 'number' }
      ]
    }
  })

  assert.equal(result.success, true)
})

test('data schema accepts array selector/selectorAll (union of selectors)', () => {
  const result = extractInputSchema.safeParse({
    url: 'https://microlink.io',
    data: {
      media: {
        selectorAll: ['video[src]', 'video source[src]'],
        attr: 'src',
        type: 'url'
      }
    }
  })

  assert.equal(result.success, true)
})

test('data schema rejects non-object rule values', () => {
  const result = extractInputSchema.safeParse({
    url: 'https://microlink.io',
    data: {
      price: 'not-a-rule'
    }
  })

  assert.equal(result.success, false)
})

test('metadata schema accepts minimal valid payload', () => {
  const result = metadataInputSchema.safeParse({
    url: 'https://microlink.io'
  })

  assert.equal(result.success, true)
})

test('metadata schema accepts meta: false to disable extraction', () => {
  const result = metadataInputSchema.safeParse({
    url: 'https://microlink.io',
    meta: false
  })

  assert.equal(result.success, true)
})

test('metadata schema accepts config object with include/exclude fields', () => {
  const result = metadataInputSchema.safeParse({
    url: 'https://microlink.io',
    meta: { logo: true, title: true, image: false }
  })

  assert.equal(result.success, true)
})

test('metadata schema coerces string booleans in config object', () => {
  const result = metadataInputSchema.safeParse({
    url: 'https://microlink.io',
    meta: { logo: 'true', image: 'false' }
  })

  assert.equal(result.success, true)
  assert.equal(result.data.meta.logo, true)
  assert.equal(result.data.meta.image, false)
})

test('metadata schema parses stringified config object', () => {
  const result = metadataInputSchema.safeParse({
    url: 'https://microlink.io',
    meta: '{"title":"true","logo":"false"}'
  })

  assert.equal(result.success, true)
  assert.equal(result.data.meta.title, true)
  assert.equal(result.data.meta.logo, false)
})

test('metadata schema rejects unknown fields in config object', () => {
  const result = metadataInputSchema.safeParse({
    url: 'https://microlink.io',
    meta: { logo: true, unknownField: true }
  })

  assert.equal(result.success, false)
})

test('logo schema accepts minimal valid payload', () => {
  const result = logoInputSchema.safeParse({
    url: 'https://microlink.io'
  })

  assert.equal(result.success, true)
})

test('logo schema accepts square: true', () => {
  const result = logoInputSchema.safeParse({
    url: 'https://microlink.io',
    square: true
  })

  assert.equal(result.success, true)
})

test('logo schema coerces string boolean square', () => {
  const result = logoInputSchema.safeParse({
    url: 'https://microlink.io',
    square: 'true'
  })

  assert.equal(result.success, true)
  assert.equal(result.data.square, true)
})

test('logo schema rejects non-boolean square value', () => {
  const result = logoInputSchema.safeParse({
    url: 'https://microlink.io',
    square: 'yes'
  })

  assert.equal(result.success, false)
})

test('logo schema rejects unknown top-level keys', () => {
  const result = logoInputSchema.safeParse({
    url: 'https://microlink.io',
    square: true,
    unknownParam: 'nope'
  })

  assert.equal(result.success, false)
  assert.match(
    result.error.issues[0].message,
    /Unrecognized key|unrecognized key/i
  )
})

test('extract schema (insights) accepts lighthouse config object', () => {
  const result = extractInputSchema.safeParse({
    url: 'https://microlink.io',
    insights: {
      lighthouse: {
        output: 'html',
        preset: 'desktop',
        onlyCategories: ['accessibility']
      },
      technologies: true
    }
  })

  assert.equal(result.success, true)
})

test('extract schema (insights) accepts boolean toggle', () => {
  const result = extractInputSchema.safeParse({
    url: 'https://microlink.io',
    insights: true
  })

  assert.equal(result.success, true)
})

test('extract schema (insights) coerces string booleans in nested settings', () => {
  const result = extractInputSchema.safeParse({
    url: 'https://microlink.io',
    insights: {
      lighthouse: 'true',
      technologies: 'false'
    }
  })

  assert.equal(result.success, true)
  assert.equal(result.data.insights.lighthouse, true)
  assert.equal(result.data.insights.technologies, false)
})

test('extract schema (insights) coerces string toggle value', () => {
  const result = extractInputSchema.safeParse({
    url: 'https://microlink.io',
    insights: 'true'
  })

  assert.equal(result.success, true)
  assert.equal(result.data.insights, true)
})

test('extract schema (insights) parses stringified object config', () => {
  const result = extractInputSchema.safeParse({
    url: 'https://microlink.io',
    insights: '{"lighthouse":{"output":"html"},"technologies":"false"}'
  })

  assert.equal(result.success, true)
  assert.equal(result.data.insights.lighthouse.output, 'html')
  assert.equal(result.data.insights.technologies, false)
})

test('video schema accepts proxy configuration', () => {
  const result = videoInputSchema.safeParse({
    url: 'https://microlink.io',
    proxy: {
      endpoint: 'https://proxy.example.com'
    }
  })

  assert.equal(result.success, true)
})

test('video schema parses stringified proxy object', () => {
  const result = videoInputSchema.safeParse({
    url: 'https://microlink.io',
    proxy: '{"endpoint":"https://proxy.example.com"}'
  })

  assert.equal(result.success, true)
  assert.equal(typeof result.data.proxy, 'object')
  assert.equal(result.data.proxy.endpoint, 'https://proxy.example.com')
})

test('audio schema accepts proxy configuration', () => {
  const result = audioInputSchema.safeParse({
    url: 'https://microlink.io',
    proxy: 'residential'
  })

  assert.equal(result.success, true)
})

test('extract schema coerces string booleans for boolean attributes', () => {
  const result = extractInputSchema.safeParse({
    url: 'https://microlink.io',
    adblock: 'true',
    animations: 'false',
    force: 'true',
    javascript: 'false',
    audio: 'true',
    video: 'false',
    palette: 'true',
    pdf: 'true',
    screenshot: 'true',
    insights: 'false',
    viewport: {
      isMobile: 'true',
      hasTouch: 'false',
      isLandscape: 'true'
    }
  })

  assert.equal(result.success, true)
  assert.equal(result.data.adblock, true)
  assert.equal(result.data.animations, false)
  assert.equal(result.data.force, true)
  assert.equal(result.data.javascript, false)
  assert.equal(result.data.audio, true)
  assert.equal(result.data.video, false)
  assert.equal(result.data.palette, true)
  assert.equal(result.data.pdf, true)
  assert.equal(result.data.screenshot, true)
  assert.equal(result.data.insights, false)
  assert.equal(result.data.viewport.isMobile, true)
  assert.equal(result.data.viewport.hasTouch, false)
  assert.equal(result.data.viewport.isLandscape, true)
})

test('extract schema parses stringified object attributes', () => {
  const result = extractInputSchema.safeParse({
    url: 'https://microlink.io',
    screenshot: '{"overlay":{"browser":"dark"}}',
    pdf: '{"landscape":"true"}',
    insights: '{"technologies":"false"}',
    viewport: '{"width":1280,"isMobile":"true"}',
    headers: '{"accept-language":"en-US","x-debug":"true"}',
    data: '{"price":{"selector":".price","type":"number"}}'
  })

  assert.equal(result.success, true)
  assert.equal(result.data.screenshot.overlay.browser, 'dark')
  assert.equal(result.data.pdf.landscape, true)
  assert.equal(result.data.insights.technologies, false)
  assert.equal(result.data.viewport.width, 1280)
  assert.equal(result.data.viewport.isMobile, true)
  assert.equal(result.data.headers['accept-language'], 'en-US')
  assert.equal(result.data.headers['x-debug'], 'true')
  assert.equal(result.data.data.price.selector, '.price')
})

test('markdown schema accepts minimal valid payload', () => {
  const result = markdownInputSchema.safeParse({
    url: 'https://microlink.io'
  })

  assert.equal(result.success, true)
})

test('markdown schema accepts optional apiKey', () => {
  const result = markdownInputSchema.safeParse({
    url: 'https://microlink.io',
    apiKey: 'my-key'
  })

  assert.equal(result.success, true)
})

test('markdown schema rejects unknown top-level keys', () => {
  const result = markdownInputSchema.safeParse({
    url: 'https://microlink.io',
    unknownParam: true
  })

  assert.equal(result.success, false)
  assert.match(
    result.error.issues[0].message,
    /Unrecognized key|unrecognized key/i
  )
})

test('text schema accepts minimal valid payload', () => {
  const result = textInputSchema.safeParse({
    url: 'https://microlink.io'
  })

  assert.equal(result.success, true)
})

test('text schema accepts optional apiKey', () => {
  const result = textInputSchema.safeParse({
    url: 'https://microlink.io',
    apiKey: 'my-key'
  })

  assert.equal(result.success, true)
})

test('text schema rejects unknown top-level keys', () => {
  const result = textInputSchema.safeParse({
    url: 'https://microlink.io',
    unknownParam: true
  })

  assert.equal(result.success, false)
  assert.match(
    result.error.issues[0].message,
    /Unrecognized key|unrecognized key/i
  )
})
