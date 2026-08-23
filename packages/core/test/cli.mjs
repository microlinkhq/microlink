import { fileURLToPath } from 'url'
import http from 'http'
import path from 'path'
import $ from 'tinyspawn'
import test from 'ava'

const bin = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../bin/index.js'
)

test('prints help with no arguments', async t => {
  const { stdout } = await $('node', [bin])
  t.true(stdout.includes('Usage'))
  t.true(stdout.includes('markdown'))
  t.true(stdout.includes('--endpoint'))
})

test('prints command help for a product with no url', async t => {
  const { stdout } = await $('node', [bin, 'metadata'])
  t.true(stdout.includes('metadata <url>'))
  t.true(stdout.includes('--palette'))
  t.true(stdout.includes('--waitUntil'))
})

test('prints command help for product --help', async t => {
  const { stdout } = await $('node', [bin, 'screenshot', '--help'])
  t.true(stdout.includes('screenshot <url>'))
  t.true(stdout.includes('--fullPage'))
  t.false(stdout.includes('Products'))
})

test('prints command help for --help before the product', async t => {
  const { stdout } = await $('node', [bin, '--help', 'screenshot'])
  t.true(stdout.includes('screenshot <url>'))
  t.true(stdout.includes('--fullPage'))
  t.false(stdout.includes('Products'))
})

test('fails on unknown commands', async t => {
  const error = await t.throwsAsync(() => $('node', [bin, 'nope', 'https://example.com']))
  t.true(error.stderr.includes('Unknown command'))
})

test('fail footer prints FAIL on stderr', async t => {
  const error = await t.throwsAsync(() =>
    $('node', [bin, 'extract', 'https://example.com', '--data', '{'])
  )
  t.true(error.stderr.includes('FAIL'))
})

test('url without a product runs metadata', async t => {
  const { stdout, stderr } = await $('node', [bin, 'https://example.com'])
  const payload = JSON.parse(stdout)
  t.is(payload.status, 'success')
  t.truthy(payload.data.title)
  t.truthy(payload.data.url)
  t.false(stdout.includes('SUCCESS'))
  t.true(stderr.includes('SUCCESS'))
})

test('trace prints request and response payload', async t => {
  const { stdout, stderr } = await $('node', [bin, 'https://example.com', '--trace'])
  const payload = JSON.parse(stdout)
  t.truthy(payload.request.url)
  t.truthy(payload.request.headers)
  t.truthy(payload.response)
  t.false(stderr.includes('SUCCESS'))
})

test('http.header flags go to the HTTP layer', async t => {
  const { stdout } = await $('node', [
    bin,
    'https://example.com',
    '--trace',
    '--http.header.authorization',
    'Bearer test'
  ])
  const payload = JSON.parse(stdout)
  t.is(payload.request.headers.authorization, 'Beare…')
  t.false(payload.request.url.includes('authorization'))
})

test('endpoint is used for the request', async t => {
  const error = await t.throwsAsync(() =>
    $('node', [bin, 'https://example.com', '--endpoint', 'https://127.0.0.1:1'])
  )
  t.true(error.stderr.includes('127.0.0.1:1'))
})

test('trace-full prints request and response payload', async t => {
  const { stdout, stderr } = await $('node', [bin, 'https://example.com', '--trace-full'])
  const payload = JSON.parse(stdout)
  t.truthy(payload.request.url)
  t.truthy(payload.response)
  t.false(stderr.includes('SUCCESS'))
})

test('trace rejects search and function', async t => {
  const search = await t.throwsAsync(() => $('node', [bin, 'search', 'coffee', '--trace']))
  t.true(search.stderr.includes('not supported'))
  const run = await t.throwsAsync(() => $('node', [bin, 'function', 'https://example.com', '--trace']))
  t.true(run.stderr.includes('not supported'))
})

test('markdown prints the raw string', async t => {
  const { stdout } = await $('node', [bin, 'markdown', 'https://example.com'])
  t.true(stdout.length > 0)
})

test('links prints an array', async t => {
  const { stdout } = await $('node', [bin, 'links', 'https://microlink.io'])
  t.true(stdout.includes('success'))
  t.true(stdout.includes('http'))
})

test('network failures report the underlying cause', async t => {
  const server = http.createServer((req, res) => res.socket.destroy())
  t.teardown(() => new Promise(resolve => server.close(resolve)))
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const endpoint = `http://127.0.0.1:${server.address().port}`

  const error = await t.throwsAsync(() =>
    $('node', [bin, 'https://example.com', '--endpoint', endpoint])
  )

  t.true(error.stderr.includes('ERROR'))
  t.true(error.stderr.includes('other side closed'))
  t.false(error.stderr.includes('Request failed due to a network error'))
})

const listenProxyNeeded = async t => {
  const server = http.createServer((req, res) => {
    res.statusCode = 403
    res.setHeader('content-type', 'application/json')
    res.end(
      JSON.stringify({
        status: 'fail',
        data: { url: 'The URL uses antibot protection. Upgrade to a PRO plan.' },
        code: 'EPROXYNEEDED',
        more: 'https://microlink.io/eproxyneeded',
        message:
          'The request has been not processed. See the errors above to know why.'
      })
    )
  })
  t.teardown(() => new Promise(resolve => server.close(resolve)))
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  return `http://127.0.0.1:${server.address().port}`
}

test('4xx errors report the reason and the code from the API', async t => {
  const endpoint = await listenProxyNeeded(t)

  const error = await t.throwsAsync(() =>
    $('node', [bin, 'https://example.com', '--endpoint', endpoint])
  )

  t.true(error.stderr.includes('uses antibot protection'))
  t.false(error.stderr.includes('See the errors above'))
  t.true(error.stderr.includes('EPROXYNEEDED (403)'))
  t.true(error.stderr.includes('https://microlink.io/eproxyneeded'))
  t.false(error.stderr.includes('Read more'))
})

test('a terminal with hyperlinks gets `Read more` pointing to the docs', async t => {
  const endpoint = await listenProxyNeeded(t)

  const error = await t.throwsAsync(() =>
    $('node', [bin, 'https://example.com', '--endpoint', endpoint], {
      env: { ...process.env, FORCE_HYPERLINK: '1' }
    })
  )

  t.true(
    error.stderr.includes(
      '\u001b]8;;https://microlink.io/eproxyneeded\u0007Read more\u001b]8;;\u0007'
    )
  )
})
