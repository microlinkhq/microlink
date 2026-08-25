'use strict'

const mql = require('@microlink/mql')

const DOMAIN = 'microlink.google'

const buildPath = (query, limit, location) =>
  [encodeURIComponent(query).replace(/%20/g, '+'), limit, location]
    .filter(v => v !== undefined)
    .join('/')

const buildUrl = (query, { limit, location, type, period, page } = {}) => {
  const url = new URL(`https://${DOMAIN}/${buildPath(query, limit, location)}`)
  if (type) url.searchParams.set('type', type)
  if (period) url.searchParams.set('period', period)
  if (page > 1) url.searchParams.set('page', String(page))
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

const fetchPage = async (url, mqlOpts, page, query) => {
  if (page > 1) url.searchParams.set('page', String(page))
  else url.searchParams.delete('page')
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
    next: () => fetchPage(new URL(url.toString()), mqlOpts, page + 1, query)
  }
}

const resolve = async (item, key) => {
  if (typeof item[key] === 'function') item[key] = await item[key]()
}

const createGoogleClient = ctxOpts => {
  return async (
    query,
    { limit, location, type, period, html, markdown, page = 1, ...opts } = {}
  ) => {
    const url = buildUrl(query, { limit, location, type, period, page })
    const result = await fetchPage(url, { ...ctxOpts, ...opts }, page, query)
    if (html) {
      await resolve(result, 'html')
      await Promise.all(result.results.map(item => resolve(item, 'html')))
    }
    if (markdown) {
      await resolve(result, 'markdown')
      await Promise.all(result.results.map(item => resolve(item, 'markdown')))
    }
    return result
  }
}

module.exports = createGoogleClient
module.exports.buildPath = buildPath
module.exports.buildUrl = buildUrl
module.exports.DOMAIN = DOMAIN
