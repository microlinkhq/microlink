import { createRequire } from 'module'
import test from 'ava'

const require = createRequire(import.meta.url)

const DASHBOARD = 'https://dashboard.microlink.io'

const opened = []
require('../bin/open')
require.cache[require.resolve('../bin/open')].exports = url => opened.push(url)
const { authorize } = require('../bin/dashboard')

const startHandshake = async () => {
  delete process.env.MICROLINK_CONNECT_TOKEN
  delete process.env.MICROLINK_DASHBOARD_URL
  const before = opened.length
  const writeStderr = process.stderr.write
  process.stderr.write = () => true
  const handshake = authorize()
  while (opened.length === before) await new Promise(resolve => setImmediate(resolve))
  process.stderr.write = writeStderr
  const url = new URL(opened.at(-1))
  const send = (method, headers = {}, body) =>
    fetch(`http://127.0.0.1:${url.searchParams.get('port')}/`, {
      method,
      headers,
      body
    })
  return { handshake, state: url.searchParams.get('state'), send }
}

const finish = async ({ handshake, state, send }) => {
  await send(
    'POST',
    { origin: DASHBOARD, 'content-type': 'application/json' },
    JSON.stringify({ state, token: 'tok' })
  )
  return handshake
}

test.serial('the dashboard origin passes preflight with its own origin echoed', async t => {
  const session = await startHandshake()
  const res = await session.send('OPTIONS', { origin: DASHBOARD })

  t.is(res.status, 204)
  t.is(res.headers.get('access-control-allow-origin'), DASHBOARD)
  t.is(res.headers.get('access-control-allow-private-network'), 'true')
  t.is(res.headers.get('vary'), 'Origin')
  await finish(session)
})

test.serial('a foreign origin fails preflight without CORS headers', async t => {
  const session = await startHandshake()
  const res = await session.send('OPTIONS', { origin: 'https://evil.example' })

  t.is(res.status, 403)
  t.is(res.headers.get('access-control-allow-origin'), null)
  t.is(res.headers.get('access-control-allow-private-network'), null)
  await finish(session)
})

for (const [name, headers] of [
  ['a foreign origin', { origin: 'https://evil.example' }],
  ['a dashboard lookalike', { origin: 'https://dashboard.microlink.io.evil.example' }],
  ['an opaque origin', { origin: 'null' }],
  ['no origin', {}]
]) {
  test.serial(`a token posted from ${name} is refused and the dashboard's still lands`, async t => {
    const session = await startHandshake()
    const res = await session.send(
      'POST',
      { ...headers, 'content-type': 'text/plain' },
      JSON.stringify({ state: session.state, token: 'attacker_token' })
    )

    t.is(res.status, 403)
    t.is((await finish(session)).token, 'tok')
  })
}

test.serial('a dashboard URL with an opaque origin opens no listener', async t => {
  delete process.env.MICROLINK_CONNECT_TOKEN
  process.env.MICROLINK_DASHBOARD_URL = 'foo://bar'
  const before = opened.length
  await t.throwsAsync(authorize(), { message: /http or https/ })
  t.is(opened.length, before)
  delete process.env.MICROLINK_DASHBOARD_URL
})
