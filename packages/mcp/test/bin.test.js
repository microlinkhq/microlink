import test from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { constants } from 'node:fs'
import { access, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const packageJsonUrl = new URL('../package.json', import.meta.url)
const binUrl = new URL('../bin/microlink-mcp.js', import.meta.url)

test('package.json exposes microlink-mcp bin entry', async () => {
  const pkgRaw = await readFile(packageJsonUrl, 'utf8')
  const pkg = JSON.parse(pkgRaw)

  assert.equal(pkg.bin['microlink-mcp'], './bin/microlink-mcp.js')
})

test('bin file has node shebang and executable permissions', async () => {
  const binSource = await readFile(binUrl, 'utf8')

  assert.match(binSource, /^#!\/usr\/bin\/env node/)
  await access(binUrl, constants.X_OK)
})

test('bin starts without immediate crash', async t => {
  const binPath = fileURLToPath(binUrl)
  const child = spawn(binPath, [], {
    stdio: ['pipe', 'pipe', 'pipe']
  })

  let stderr = ''
  child.stderr.on('data', chunk => {
    stderr += chunk.toString()
  })

  t.after(() => {
    if (!child.killed && child.exitCode === null) {
      child.kill('SIGTERM')
    }
  })

  await new Promise(resolve => setTimeout(resolve, 300))

  assert.equal(
    child.exitCode,
    null,
    `bin exited early with code ${child.exitCode}. stderr: ${stderr.trim()}`
  )

  child.kill('SIGTERM')
  await new Promise(resolve => {
    child.once('exit', () => {
      resolve()
    })
  })
})
