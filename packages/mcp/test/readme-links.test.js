import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const README_URL_PATTERN = /https:\/\/microlink\.io[^\s)\]]*/g

test('README uses the live MCP integration route', async () => {
  const readme = await readFile(
    new URL('../README.md', import.meta.url),
    'utf8'
  )
  const urls = [...new Set(readme.match(README_URL_PATTERN) ?? [])]

  assert.ok(urls.includes('https://microlink.io/integrations/mcp'))
  assert.ok(!urls.includes('https://microlink.io/integration/mcp'))
})
