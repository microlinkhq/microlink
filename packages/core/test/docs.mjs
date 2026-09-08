import { createRequire } from 'module'
import test from 'ava'

const require = createRequire(import.meta.url)
const { load, url } = require('../bin/docs')

test('points at the SDK method markdown file', t => {
  t.is(url('markdown'), 'https://microlink.io/docs/sdk/methods/markdown.md')
})

test('load fetches the markdown file', async t => {
  const text = await load('markdown', (href, opts) => {
    t.is(href, url('markdown'))
    t.true(opts.signal instanceof AbortSignal)
    return Promise.resolve({
      ok: true,
      text: () => Promise.resolve('# markdown\n')
    })
  })
  t.is(text, '# markdown\n')
})

test('load throws when the page is missing', async t => {
  const error = await t.throwsAsync(() =>
    load('markdown', () => Promise.resolve({ ok: false, status: 404 }))
  )
  t.true(error.message.includes('404'))
})
