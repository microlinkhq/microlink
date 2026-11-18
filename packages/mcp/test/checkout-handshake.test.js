import test from 'node:test'
import assert from 'node:assert/strict'

import { listenForConnect } from '../src/checkout-handshake.js'

const DASHBOARD = 'https://dashboard.microlink.io'
const STATE = 'a'.repeat(32)

async function listen (t, origin = DASHBOARD) {
  const tokens = []
  const listener = await listenForConnect({
    state: STATE,
    origin,
    timeoutMs: 60_000,
    onToken: body => tokens.push(body.token) > 0,
    onTimeout: () => {}
  })
  t.after(listener.close)
  const send = (method, headers = {}, body) =>
    fetch(`http://127.0.0.1:${listener.port}/`, { method, headers, body })
  return { tokens, send }
}

const connectBody = JSON.stringify({ state: STATE, token: 'tok' })

test('the dashboard origin passes preflight with its own origin echoed', async t => {
  const { send } = await listen(t)
  const res = await send('OPTIONS', { origin: DASHBOARD })

  assert.equal(res.status, 204)
  assert.equal(res.headers.get('access-control-allow-origin'), DASHBOARD)
  assert.equal(res.headers.get('access-control-allow-private-network'), 'true')
  assert.equal(res.headers.get('vary'), 'Origin')
})

test('a foreign origin fails preflight without CORS headers', async t => {
  const { send } = await listen(t)
  const res = await send('OPTIONS', { origin: 'https://evil.example' })

  assert.equal(res.status, 403)
  assert.equal(res.headers.get('access-control-allow-origin'), null)
  assert.equal(res.headers.get('access-control-allow-private-network'), null)
})

for (const [name, headers] of [
  ['a foreign origin', { origin: 'https://evil.example' }],
  [
    'a dashboard lookalike',
    { origin: 'https://dashboard.microlink.io.evil.example' }
  ],
  ['the dashboard over http', { origin: 'http://dashboard.microlink.io' }],
  ['an opaque origin', { origin: 'null' }],
  ['no origin', {}]
]) {
  test(`a token posted from ${name} is refused even with the right state`, async t => {
    const { tokens, send } = await listen(t)
    const res = await send(
      'POST',
      { ...headers, 'content-type': 'text/plain' },
      connectBody
    )

    assert.equal(res.status, 403)
    assert.deepEqual(tokens, [])
  })
}

test('the dashboard origin delivers the token', async t => {
  const { tokens, send } = await listen(t)
  const res = await send(
    'POST',
    { origin: DASHBOARD, 'content-type': 'application/json' },
    connectBody
  )

  assert.equal(res.status, 204)
  assert.equal(res.headers.get('access-control-allow-origin'), DASHBOARD)
  assert.deepEqual(tokens, ['tok'])
})

test('a dashboard URL with an opaque origin opens no listener', async () => {
  await assert.rejects(
    listenForConnect({
      state: STATE,
      origin: new URL('foo://bar').origin,
      timeoutMs: 60_000,
      onToken: () => true,
      onTimeout: () => {}
    }),
    /http or https/
  )
})
