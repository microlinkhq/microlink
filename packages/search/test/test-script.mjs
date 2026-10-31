import { createRequire } from 'module'
import test from 'ava'

const pkg = createRequire(import.meta.url)('../package.json')

test('pnpm test runs ava and then tsd', t => {
  t.is(pkg.scripts.test, 'ava && tsd')
})

test('ava allows one minute per test', t => {
  t.is(pkg.ava && pkg.ava.timeout, '1m')
})
