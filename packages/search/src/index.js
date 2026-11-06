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

const HELD_LINK = 'EGOOGLELINK'
const HELD_LINK_ATTEMPTS = 3
const HELD_LINK_RETRY_AFTER_SECONDS = 60
const HELD_LINK_MAX_WAIT_MS = 120000
const HELD_LINK_JITTER = 0.2

const retryAfterMs = error => {
  const seconds = Number.parseInt(error.headers?.['retry-after'], 10)
  const waitMs =
    (Number.isFinite(seconds) ? seconds : HELD_LINK_RETRY_AFTER_SECONDS) * 1000
  const spreadMs = Math.max(waitMs, 0) * (1 + Math.random() * HELD_LINK_JITTER)
  return Math.min(spreadMs, HELD_LINK_MAX_WAIT_MS)
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

const fetchDataField = async (
  url,
  mqlOpts,
  field,
  attr,
  attemptsLeft = HELD_LINK_ATTEMPTS
) => {
  try {
    const { data } = await mql(url, {
      ...mqlOpts,
      data: { [field]: { attr } }
    })
    return data[field]
  } catch (error) {
    if (error.code !== HELD_LINK || attemptsLeft <= 1) throw error
    await sleep(retryAfterMs(error))
    return fetchDataField(url, mqlOpts, field, attr, attemptsLeft - 1)
  }
}

const fetchPage = async (url, mqlOpts, page, query, last) => {
  if (page > 1) url.searchParams.set('page', String(page))
  else url.searchParams.delete('page')
  const { data, response } = await mql(url.toString(), mqlOpts)
  last.response = response
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
      fetchPage(new URL(url.toString()), mqlOpts, page + 1, query, last)
  }
}

const resolve = async (item, key) => {
  if (typeof item[key] === 'function') item[key] = await item[key]()
}

const resolveAll = async (page, key) => {
  await resolve(page, key)
  const settled = await Promise.allSettled(
    page.results.map(item => resolve(item, key))
  )
  const failure = settled.find(({ status }) => status === 'rejected')
  if (failure) throw failure.reason
}

const createGoogleClient = ctxOpts => {
  const last = {}
  const client = async (
    query,
    { limit, location, type, period, html, markdown, page = 1, ...opts } = {}
  ) => {
    const url = buildUrl(query, { limit, location, type, period, page })
    const result = await fetchPage(
      url,
      { ...ctxOpts, ...opts },
      page,
      query,
      last
    )
    if (html) await resolveAll(result, 'html')
    if (markdown) await resolveAll(result, 'markdown')
    return result
  }
  Object.defineProperty(client, 'last', { value: last })
  return client
}

module.exports = createGoogleClient
module.exports.buildPath = buildPath
module.exports.buildUrl = buildUrl
module.exports.DOMAIN = DOMAIN
