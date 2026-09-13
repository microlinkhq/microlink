import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const readme = await readFile(new URL('../README.md', import.meta.url), 'utf8')

function section (start, end) {
  return readme.slice(readme.indexOf(start), readme.indexOf(end))
}

test('VS Code example uses its native MCP configuration shape', () => {
  const vscode = section('### VS Code\n', '### Cursor\n')

  assert.match(vscode, /\.vscode\/mcp\.json/)
  assert.match(vscode, /"servers":/)
  assert.match(vscode, /"type": "stdio"/)
  assert.doesNotMatch(vscode, /"mcpServers":/)
})

test('Cursor example keeps the portable mcpServers shape', () => {
  const cursor = section('### Cursor\n', '## Usage\n')
  assert.match(cursor, /"mcpServers":/)
})
