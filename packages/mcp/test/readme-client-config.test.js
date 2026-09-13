import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const readme = await readFile(new URL('../README.md', import.meta.url), 'utf8')

function section (start, end) {
  return readme.slice(readme.indexOf(start), readme.indexOf(end))
}

test('VS Code examples use its native MCP configuration shape', () => {
  const vscode = section('### VS Code\n', '### Cursor\n')
  const published = section(
    'Add the published package to `.vscode/mcp.json`:',
    'For a local repository checkout'
  )
  const local = section('For a local repository checkout', '### Cursor\n')

  assert.match(vscode, /\.vscode\/mcp\.json/)
  assert.doesNotMatch(vscode, /"mcpServers":/)

  assert.match(published, /"servers":/)
  assert.match(published, /"type": "stdio"/)
  assert.match(published, /"command": "npx"/)
  assert.match(published, /"MICROLINK_API_KEY"/)

  assert.match(local, /"type": "stdio"/)
  assert.match(local, /"command": "node"/)
  assert.match(local, /"args": \["\/absolute\/path\/to\/mcp\/src\/index\.js"\]/)
  assert.match(local, /"MICROLINK_API_KEY"/)
})

test('Cursor example keeps the portable mcpServers shape', () => {
  const cursor = section('### Cursor\n', '## Usage\n')
  assert.match(cursor, /"mcpServers":/)
})
