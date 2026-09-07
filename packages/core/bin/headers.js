'use strict'

const HTTP_HEADER = 'http.header.'

const toPlainHeaders = headers => {
  if (!headers) return {}
  if (typeof headers.entries === 'function') {
    return Object.fromEntries(headers.entries())
  }
  return headers
}

const parseHeaders = input => {
  const headers = {}
  for (const item of [].concat(input ?? [])) {
    const index = String(item).indexOf(':')
    if (index === -1) continue
    headers[String(item).slice(0, index).trim().toLowerCase()] = String(item)
      .slice(index + 1)
      .trim()
  }
  return headers
}

const takeHttpHeaders = flags => {
  const headers = {}
  for (const key of Object.keys(flags)) {
    if (!key.startsWith(HTTP_HEADER)) continue
    let value = flags[key]
    delete flags[key]
    if (Array.isArray(value)) value = value.at(-1)
    if (typeof value !== 'string' && typeof value !== 'number') continue
    const name = key.slice(HTTP_HEADER.length).toLowerCase()
    if (name) headers[name] = String(value)
  }
  return headers
}

module.exports = { parseHeaders, takeHttpHeaders, toPlainHeaders }
