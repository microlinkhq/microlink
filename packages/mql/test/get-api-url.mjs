'use strict'

import test from 'ava'

import mql from '@microlink/mql'

test('url without query params', t => {
  t.snapshot(mql.getApiUrl('https://kikobeats.com'))
})

test('apiKey', t => {
  t.snapshot(mql.getApiUrl('https://kikobeats.com', { apiKey: 'foobar' }))
})

test('flatten options', t => {
  t.snapshot(
    mql.getApiUrl('https://kikobeats.com', { overlay: { browser: 'dark' } })
  )
})

test("don't pass null", t => {
  t.snapshot(mql.getApiUrl('https://kikobeats.com', { colorScheme: undefined }))
  t.snapshot(mql.getApiUrl('https://kikobeats.com', { colorScheme: null }))
})

test("don't pass undefined", t => {
  t.snapshot(mql.getApiUrl('https://kikobeats.com', { colorScheme: undefined }))
  t.snapshot(mql.getApiUrl('https://kikobeats.com', { colorScheme: null }))
})

test('timeout', t => {
  t.snapshot(mql.getApiUrl('https://kikobeats.com', { timeout: 15000 }))
  t.snapshot(mql.getApiUrl('https://kikobeats.com', { timeout: 28000 }))
})

test('waitUntil', t => {
  t.snapshot(mql.getApiUrl('https://kikobeats.com', { waitUntil: 'load' }))
  t.snapshot(
    mql.getApiUrl('https://kikobeats.com', {
      waitUntil: ['load', 'networkidle0']
    })
  )
})

test('undefined', t => {
  t.snapshot(mql.getApiUrl('https://kikobeats.com', { waitUntil: undefined }))
  t.snapshot(
    mql.getApiUrl('https://kikobeats.com', {
      screenshot: { element: '#screenshot', type: undefined }
    })
  )
})

test('actions flatten to dotted keys', t => {
  t.snapshot(
    mql.getApiUrl('https://app.example.com/login', {
      meta: false,
      screenshot: true,
      actions: [
        { type: 'fill', label: 'Email', value: 'user@example.com' },
        { type: 'fill', label: 'Password', value: 'secret' },
        { type: 'click', role: 'button', name: 'Sign in' },
        { type: 'wait', text: 'Dashboard' },
        { type: 'screenshot', fullPage: true }
      ]
    })
  )
})
