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

test('sets page param when greater than 1', t => {
  const url = buildUrl('q', { page: 2 })
  t.is(url.searchParams.get('page'), '2')
})

test('omits page on the first page', t => {
  t.is(buildUrl('q').searchParams.get('page'), null)
  t.is(buildUrl('q', { page: 1 }).searchParams.get('page'), null)
})

test('combines all options', t => {
  const url = buildUrl('q', {
    limit: 5,
    location: 'fr',
    type: 'images',
    period: 'last_month',
    page: 3
  })
  t.is(url.pathname, '/q/5/fr')
  t.is(url.searchParams.get('type'), 'images')
  t.is(url.searchParams.get('period'), 'last_month')
  t.is(url.searchParams.get('page'), '3')
})
