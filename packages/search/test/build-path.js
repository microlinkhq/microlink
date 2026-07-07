'use strict'

const test = require('ava')

const { buildPath } = require('../src')

test('encodes spaces as +', t => {
  t.is(buildPath('Lotus Elise S2'), 'Lotus+Elise+S2')
})

test('encodes special characters', t => {
  const path = buildPath('c++ tutorial & more')
  t.true(path.includes('c%2B%2B'))
  t.true(path.includes('%26'))
})

test('includes all segments when provided', t => {
  t.is(buildPath('query', 10, 'en'), 'query/10/en')
})

test('skips undefined limit', t => {
  t.is(buildPath('query', undefined, 'es'), 'query/es')
})

test('skips undefined location', t => {
  t.is(buildPath('query', 5), 'query/5')
})

test('query only', t => {
  t.is(buildPath('hello'), 'hello')
})

test('handles numeric limit as-is', t => {
  t.is(buildPath('q', 0, 'en'), 'q/0/en')
})
