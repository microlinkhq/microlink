'use strict'

const test = require('ava')

const { buildUrl, DOMAIN } = require('../src')

test('returns URL with correct domain', t => {
  const url = buildUrl('test')
  t.is(url.hostname, DOMAIN)
  t.is(url.protocol, 'https:')
})

test('sets pathname from buildPath', t => {
  const url = buildUrl('hello world', { limit: 10, location: 'en' })
  t.is(url.pathname, '/hello+world/10/en')
})

test('sets type param', t => {
  const url = buildUrl('q', { type: 'news' })
  t.is(url.searchParams.get('type'), 'news')
})

test('omits type when not provided', t => {
  const url = buildUrl('q')
  t.is(url.searchParams.get('type'), null)
})

test('sets period param', t => {
  const url = buildUrl('q', { period: 'last_year' })
  t.is(url.searchParams.get('period'), 'last_year')
})

test('omits falsy params', t => {
  const url = buildUrl('q')
  t.is(url.searchParams.get('type'), null)
  t.is(url.searchParams.get('period'), null)
})

test('combines all options', t => {
  const url = buildUrl('q', {
    limit: 5,
    location: 'fr',
    type: 'images',
    period: 'last_month'
  })
  t.is(url.pathname, '/q/5/fr')
  t.is(url.searchParams.get('type'), 'images')
  t.is(url.searchParams.get('period'), 'last_month')
})
