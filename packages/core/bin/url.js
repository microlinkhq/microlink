'use strict'

const httpUrl = value => {
  if (!URL.canParse(value)) return
  const { protocol } = new URL(value)
  if (protocol === 'http:' || protocol === 'https:') return value
}

const asUrl = input => {
  if (typeof input !== 'string' || !input) return
  if (httpUrl(input)) return input
  if (/^[a-z][a-z\d+.-]*:\/\//i.test(input) || !/[.:]/.test(input)) return
  return httpUrl(`https://${input}`)
}

module.exports = { asUrl }
