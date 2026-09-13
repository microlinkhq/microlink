import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const readJson = async path =>
  JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'))

test('README states the package Node.js requirement', async () => {
  const readme = await readFile(
    new URL('../README.md', import.meta.url),
    'utf8'
  )
  const pkg = await readJson('../package.json')
  const minimumNode = pkg.engines.node.match(/\d+/)?.[0]

  assert.ok(minimumNode)
  assert.match(readme, new RegExp(`Node\\.js ${minimumNode} or newer`))
})
