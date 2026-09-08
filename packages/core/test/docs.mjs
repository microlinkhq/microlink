import { createRequire } from 'module'
import test from 'ava'

const require = createRequire(import.meta.url)
const { resolve, load, toMarkdownUrl, HREF } = require('../bin/docs')

const PRODUCTS = [
  'metadata',
  'logo',
  'markdown',
  'html',
  'text',
  'video',
  'audio',
  'emails',
  'links',
  'images',
  'videos',
  'audios',
  'extract',
  'screenshot',
  'pdf',
  'embed',
  'technologies',
  'lighthouse',
  'search',
  'function'
]

test('every product maps to an SDK docs page', t => {
  t.deepEqual(Object.keys(HREF).sort(), PRODUCTS.sort())
  for (const name of PRODUCTS) {
    t.true(HREF[name].startsWith('/docs/sdk/'), name)
    t.deepEqual(resolve(name), { href: HREF[name] })
  }
})

test('accepts a leading dot the sidebar uses for methods', t => {
  t.deepEqual(resolve('.markdown'), { href: '/docs/sdk/methods/markdown' })
})

test('unknown product', t => {
  t.deepEqual(resolve('nope'), { error: 'unknown' })
})

test('load fetches the markdown file', async t => {
  const href = '/docs/sdk/methods/markdown'
  const text = await load(href, url => {
    t.is(url, toMarkdownUrl(href))
    return Promise.resolve({
      ok: true,
      text: () => Promise.resolve('# markdown\n')
    })
  })
  t.is(text, '# markdown\n')
})

test('load throws when the page is missing', async t => {
  const error = await t.throwsAsync(() =>
    load('/docs/sdk/methods/markdown', () =>
      Promise.resolve({ ok: false, status: 404 })
    )
  )
  t.true(error.message.includes('404'))
})
