import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import {
  FREE_PLAN_REQUESTS_PER_DAY,
  KEYLESS_REQUESTS_PER_DAY
} from '../src/free-tier.js'

const DAILY_QUOTA = /(\d+) requests\/day/g

test('README daily quotas match the free tier constants', async () => {
  const readme = await readFile(
    new URL('../README.md', import.meta.url),
    'utf8'
  )
  const stated = new Set(
    [...readme.matchAll(DAILY_QUOTA)].map(([, n]) => Number(n))
  )

  assert.deepEqual(
    stated,
    new Set([KEYLESS_REQUESTS_PER_DAY, FREE_PLAN_REQUESTS_PER_DAY])
  )
})
