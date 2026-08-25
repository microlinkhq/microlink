'use strict'

const mql = require('@microlink/mql')

const DOMAIN = 'microlink.google'

const buildPath = (query, limit, location) =>
  [encodeURIComponent(query).replace(/%20/g, '+'), limit, location]
    .filter(v => v !== undefined)
    .join('/')

const buildUrl = (query, { limit, location, type, period } = {}) => {
  const url = new URL(`https://${DOMAIN}/${buildPath(query, limit, location)}`)
  if (type) url.searchParams.set('type', type)
  if (period) url.searchParams.set('period', period)
  return url
}

const resultUrl = result => result.url

const fetchDataField = async (url, mqlOpts, field, attr) => {
  const { data } = await mql(url, {
    ...mqlOpts,
    data: { [field]: { attr } }
  })
  return data[field]
}

const fetchPage = async (url, mqlOpts, offset, query) => {
  url.searchParams.set('start', String(offset))
  const { data } = await mql(url.toString(), mqlOpts)
  const { results, ...extra } = data

  return {
    ...extra,
    html: () =>
      fetchDataField(
        `https://www.google.com/search?q=${encodeURIComponent(query)}`,
        mqlOpts,
        'content',
        'html'
      ),
    markdown: () =>
      fetchDataField(
        `https://www.google.com/search?q=${encodeURIComponent(query)}`,
        mqlOpts,
        'markdown',
        'markdown'
      ),
    results: results.map(result => {
      const url = resultUrl(result)
      return {
        ...result,
        ...(url && {
          html: () => fetchDataField(url, mqlOpts, 'content', 'html'),
          markdown: () => fetchDataField(url, mqlOpts, 'markdown', 'markdown')
        })
      }
    }),
    next: () =>
      fetchPage(
        new URL(url.toString()),
        mqlOpts,
        offset + results.length,
        query
      )
  }
}

const resolve = async (item, key) => {
  if (typeof item[key] === 'function') item[key] = await item[key]()
}

const createGoogleClient = ctxOpts => {
  return async (
    query,
    { limit, location, type, period, html, markdown, ...opts } = {}
  ) => {
    const url = buildUrl(query, { limit, location, type, period })
    const page = await fetchPage(url, { ...ctxOpts, ...opts }, 0, query)
    if (html) {
      await resolve(page, 'html')
      await Promise.all(page.results.map(result => resolve(result, 'html')))
    }
    if (markdown) {
      await resolve(page, 'markdown')
      await Promise.all(page.results.map(result => resolve(result, 'markdown')))
    }
    return page
  }
}

module.exports = createGoogleClient
module.exports.buildPath = buildPath
module.exports.buildUrl = buildUrl
module.exports.DOMAIN = DOMAIN
