'use strict'

const url = product => `https://microlink.io/docs/sdk/methods/${product}.md`

const load = async (product, fetchFn = fetch) => {
  const href = url(product)
  const res = await fetchFn(href)
  if (!res.ok) throw new Error(`Failed to fetch ${href} (${res.status})`)
  return res.text()
}

module.exports = { load, url }
