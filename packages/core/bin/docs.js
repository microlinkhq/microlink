'use strict'

const SITE = 'https://microlink.io'

const HREF = {
  metadata: '/docs/sdk/methods/metadata',
  screenshot: '/docs/sdk/methods/screenshot',
  pdf: '/docs/sdk/methods/pdf',
  markdown: '/docs/sdk/methods/markdown',
  html: '/docs/sdk/methods/html',
  text: '/docs/sdk/methods/text',
  function: '/docs/sdk/methods/function',
  search: '/docs/sdk/methods/search',
  extract: '/docs/sdk/methods/extract',
  logo: '/docs/sdk/methods/logo',
  emails: '/docs/sdk/methods/collections/emails',
  links: '/docs/sdk/methods/collections/links',
  images: '/docs/sdk/methods/collections/images',
  videos: '/docs/sdk/methods/collections/videos',
  audios: '/docs/sdk/methods/collections/audios',
  video: '/docs/sdk/methods/media/video',
  audio: '/docs/sdk/methods/media/audio',
  embed: '/docs/sdk/methods/embed',
  technologies: '/docs/sdk/methods/insights/technologies',
  lighthouse: '/docs/sdk/methods/insights/lighthouse'
}

const resolve = name => {
  const href = HREF[String(name).toLowerCase().replace(/^\./, '')]
  return href ? { href } : { error: 'unknown' }
}

const toMarkdownUrl = href => `${SITE}${href.replace(/\/+$/, '')}.md`

const load = async (href, fetchFn = fetch) => {
  const url = toMarkdownUrl(href)
  const res = await fetchFn(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url} (${res.status})`)
  return res.text()
}

module.exports = { resolve, load, toMarkdownUrl, HREF }
