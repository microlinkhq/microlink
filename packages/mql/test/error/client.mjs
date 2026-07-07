'use strict'

import { listen } from 'async-listen'
import http from 'http'
import test from 'ava'

import mql from '@microlink/mql'

test('EINVALURLCLIENT', async t => {
  const error = await t.throwsAsync(mql(), { instanceOf: mql.MicrolinkError })

  t.true(error.url === '')
  t.true(error.code === 'EINVALURLCLIENT')
  t.true(error.status === 'fail')
  t.true(error.more === 'https://microlink.io/einvalurlclient')
  t.true(error.statusCode === undefined)
  t.true(!!error.data)
  t.true(!!error.message)
  t.true(!!error.description)
})

test('EFATALCLIENT', async t => {
  let count = 0

  const hooks = {
    beforeRetry: [
      () => ++count
    ]
  }

  const error = await t.throwsAsync(
    mql('https://example.com', { endpoint: 'https://notexist.dev' }, { retry: 2, hooks }),
    { instanceOf: mql.MicrolinkError }
  )

  t.is(count, 2)
  t.true(error.url === 'https://notexist.dev?url=https%3A%2F%2Fexample.com')
  t.true(error.code === 'EFATALCLIENT')
  t.true(error.status === 'error')
  t.true(error.more === 'https://microlink.io/efatalclient')
  t.true(error.statusCode === undefined)
  t.true(!!error.data)
  t.true(!!error.message)
  t.true(!!error.description)
})

test("don't retry 429 status code", async t => {
  const server = http.createServer((req, res) => {
    res.statusCode = 429
    res.end('429 Too Many Requests')
  })
  t.teardown(async () => {
    await new Promise(resolve => server.close(resolve))
  })

  const endpoint = await listen(server)

  let count = 0

  const hooks = {
    beforeRetry: [
      () => ++count
    ]
  }

  const error = await t.throwsAsync(
    mql('https://example.com', { endpoint }, { hooks }),
    { instanceOf: mql.MicrolinkError }
  )

  t.is(count, 0)
  t.is(error.statusCode, 429)
})
