import { createRequire } from 'module'
import test from 'ava'

const require = createRequire(import.meta.url)
const { orange, link } = require('../bin/style')

const withColors = (t, hasColors) => {
  const original = Object.getOwnPropertyDescriptor(process.stdout, 'hasColors')
  process.stdout.hasColors = hasColors
  t.teardown(() => {
    if (original) Object.defineProperty(process.stdout, 'hasColors', original)
    else delete process.stdout.hasColors
  })
}

test('orange is plain text when the terminal has no colors', t => {
  withColors(t, () => false)
  t.is(orange('FAIL'), 'FAIL')
})

test('orange is plain text when the terminal cannot report colors', t => {
  withColors(t, undefined)
  t.is(orange('FAIL'), 'FAIL')
})

test('orange uses the 256 color palette when the terminal has colors', t => {
  withColors(t, () => true)
  t.is(orange('FAIL'), '\u001b[38;5;208mFAIL\u001b[39m')
})

test('link falls back to the url when the terminal has no hyperlinks', t => {
  t.is(
    link('https://microlink.io/eproxyneeded', 'Read more'),
    'https://microlink.io/eproxyneeded'
  )
})

test('link is the url itself when there is no text to show', t => {
  t.is(link('https://microlink.io/eproxyneeded'), 'https://microlink.io/eproxyneeded')
})
