import { fileURLToPath } from 'url'
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
