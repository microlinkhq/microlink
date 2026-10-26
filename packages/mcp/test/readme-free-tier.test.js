import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import {
  FREE_PLAN_REQUESTS_PER_DAY,
  KEYLESS_REQUESTS_PER_DAY
} from '../src/free-tier.js'

const KEYLESS_QUOTA = /`(\d+) requests\/day` without a key/
const FREE_PLAN_QUOTA = /`(\d+) requests\/day` with a free API key/
const ANY_DAILY_QUOTA = /(\d+) requests\/day/g

const readReadme = () =>
  readFile(new URL('../README.md', import.meta.url), 'utf8')

test('README states the keyless daily quota', async () => {
  const [, quota] = (await readReadme()).match(KEYLESS_QUOTA) ?? []
  assert.equal(Number(quota), KEYLESS_REQUESTS_PER_DAY)
})

test('README states the free API key daily quota', async () => {
  const [, quota] = (await readReadme()).match(FREE_PLAN_QUOTA) ?? []
  assert.equal(Number(quota), FREE_PLAN_REQUESTS_PER_DAY)
})

test('README states no other daily quota', async () => {
  const quotas = [...(await readReadme()).matchAll(ANY_DAILY_QUOTA)].map(
    ([, quota]) => Number(quota)
  )
  for (const quota of quotas) {
    assert.ok(
      [KEYLESS_REQUESTS_PER_DAY, FREE_PLAN_REQUESTS_PER_DAY].includes(quota),
      `unexpected ${quota} requests/day`
    )
  }
})
