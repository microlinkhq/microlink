'use strict'

const products = [
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

const url = product => `https://microlink.io/docs/sdk/methods/${product}.md`

const load = async (product, fetchFn = fetch) => {
  const href = url(product)
  const res = await fetchFn(href, { signal: AbortSignal.timeout(10_000) })
  if (!res.ok) throw new Error(`Failed to fetch ${href} (${res.status})`)
  return res.text()
}

module.exports = { load, url, products }
