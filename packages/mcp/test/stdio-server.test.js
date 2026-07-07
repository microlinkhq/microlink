import test from 'node:test'
import assert from 'node:assert/strict'

import {
  createMicrolinkServer,
  shutdown,
  startStdioServer
} from '../src/index.js'

test('createMicrolinkServer returns MCP server instance', () => {
  const server = createMicrolinkServer()

  assert.equal(typeof server.connect, 'function')
  assert.equal(typeof server.close, 'function')
})

test('startStdioServer connects provided server and transport', async () => {
  let receivedTransport
  const fakeServer = {
    async connect (transport) {
      receivedTransport = transport
    }
  }
  const fakeTransport = { kind: 'stdio' }

  const result = await startStdioServer({
    server: fakeServer,
    transport: fakeTransport
  })

  assert.equal(receivedTransport, fakeTransport)
  assert.equal(result.server, fakeServer)
  assert.equal(result.transport, fakeTransport)
})

test('shutdown closes server and exits with status 0', async t => {
  const originalExit = process.exit
  const originalConsoleError = console.error

  t.after(() => {
    process.exit = originalExit
    console.error = originalConsoleError
  })

  let closed = false
  let exitCode
  process.exit = code => {
    exitCode = code
  }
  console.error = () => {}

  await shutdown({
    server: {
      async close () {
        closed = true
      }
    },
    signal: 'SIGTERM'
  })

  assert.equal(closed, true)
  assert.equal(exitCode, 0)
})
