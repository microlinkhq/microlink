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

test('markdown prints the raw string', async t => {
  const { stdout } = await $('node', [bin, 'markdown', 'https://example.com'])
  t.true(stdout.length > 0)
})

test('links prints an array', async t => {
  const { stdout } = await $('node', [bin, 'links', 'https://microlink.io'])
  t.true(stdout.trim().startsWith('['))
  t.true(stdout.includes('http'))
})
