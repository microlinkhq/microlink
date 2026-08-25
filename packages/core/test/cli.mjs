import { fileURLToPath } from 'url'
import { spawn } from 'child_process'
import { mkdirSync, mkdtempSync, writeFileSync, existsSync } from 'fs'
import { tmpdir } from 'os'
import http from 'http'
import path from 'path'
import $ from 'tinyspawn'
import test from 'ava'

const bin = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../bin/index.js'
)

test('prints help with no arguments', async t => {
  const { stdout } = await $('node', [bin])
  t.true(stdout.includes('Usage'))
  t.true(stdout.includes('markdown'))
  t.true(stdout.includes('--endpoint'))
  t.true(stdout.includes('login'))
  t.true(stdout.includes('logout'))
})

test('prints command help for login', async t => {
  const { stdout } = await $('node', [bin, 'login', '--help'])
  t.true(stdout.includes('login'))
  t.true(stdout.includes('Save an API key'))
  t.false(stdout.includes('Products'))
})

test('prints command help for logout', async t => {
  const { stdout } = await $('node', [bin, 'logout', '--help'])
  t.true(stdout.includes('logout'))
  t.true(stdout.includes('Remove the saved API key'))
})

test('prints command help for a product with no url', async t => {
  const { stdout } = await $('node', [bin, 'metadata'])
  t.true(stdout.includes('metadata <url>'))
  t.true(stdout.includes('--palette'))
  t.true(stdout.includes('--waitUntil'))
})

test('prints command help for product --help', async t => {
  const { stdout } = await $('node', [bin, 'screenshot', '--help'])
  t.true(stdout.includes('screenshot <url>'))
  t.true(stdout.includes('--fullPage'))
  t.false(stdout.includes('Products'))
})

test('search help documents html, markdown, limit, and page flags', async t => {
  const { stdout } = await $('node', [bin, 'search', '--help'])
  t.true(stdout.includes('search <query>'))
  t.true(stdout.includes('--html'))
  t.true(stdout.includes('--markdown'))
  t.true(stdout.includes('--limit'))
  t.true(stdout.includes('--page'))
})

test('prints command help for --help before the product', async t => {
  const { stdout } = await $('node', [bin, '--help', 'screenshot'])
  t.true(stdout.includes('screenshot <url>'))
  t.true(stdout.includes('--fullPage'))
  t.false(stdout.includes('Products'))
})

test('fails on unknown commands', async t => {
  const error = await t.throwsAsync(() => $('node', [bin, 'nope', 'https://example.com']))
  t.true(error.stderr.includes('Unknown command'))

  const { endpoint, seen } = await listenSuccess(t)
  const lone = await t.throwsAsync(() => $('node', [bin, 'nope', '--endpoint', endpoint]))
  t.true(lone.stderr.includes('Unknown command'))
  t.is(seen.header, null)
})

test('fail footer prints FAIL on stderr', async t => {
  const error = await t.throwsAsync(() =>
    $('node', [bin, 'extract', 'https://example.com', '--data', '{'])
  )
  t.true(error.stderr.includes('FAIL'), error.stderr)
  t.true(error.stderr.includes('Invalid --data JSON'), error.stderr)
})

test('url without a product runs metadata', async t => {
  const { stdout, stderr } = await $('node', [bin, 'https://example.com'])
  const payload = JSON.parse(stdout)
  t.is(payload.status, 'success')
  t.truthy(payload.data.title)
  t.truthy(payload.data.url)
  t.false(stdout.includes('SUCCESS'))
  t.true(stderr.includes('SUCCESS'))
})

test('url without protocol is treated as https', async t => {
  const { endpoint } = await listenSuccess(t)
  const encoded = encodeURIComponent('https://example.com')

  const bare = await $('node', [
    bin,
    'example.com',
    '--endpoint',
    endpoint,
    '--trace'
  ])
  t.true(JSON.parse(bare.stdout).request.url.includes(encoded))

  const product = await $('node', [
    bin,
    'metadata',
    'example.com',
    '--endpoint',
    endpoint,
    '--trace'
  ])
  t.true(JSON.parse(product.stdout).request.url.includes(encoded))

  const hostPort = await $('node', [
    bin,
    'localhost:3000',
    '--endpoint',
    endpoint,
    '--trace'
  ])
  t.true(
    JSON.parse(hostPort.stdout).request.url.includes(
      encodeURIComponent('https://localhost:3000')
    )
  )
})

test('trace prints request and response payload', async t => {
  const { stdout, stderr } = await $('node', [bin, 'https://example.com', '--trace'])
  const payload = JSON.parse(stdout)
  t.truthy(payload.request.url)
  t.truthy(payload.request.headers)
  t.truthy(payload.response)
  t.false(stderr.includes('SUCCESS'))
})

test('http.header flags go to the HTTP layer', async t => {
  const { stdout } = await $('node', [
    bin,
    'https://example.com',
    '--trace',
    '--http.header.authorization',
    'Bearer test'
  ])
  const payload = JSON.parse(stdout)
  t.is(payload.request.headers.authorization, 'Beare…')
  t.false(payload.request.url.includes('authorization'))
})

test('endpoint is used for the request', async t => {
  const error = await t.throwsAsync(() =>
    $('node', [bin, 'https://example.com', '--endpoint', 'https://127.0.0.1:1'])
  )
  t.true(error.stderr.includes('127.0.0.1:1'))
})

test('trace-full prints request and response payload', async t => {
  const { stdout, stderr } = await $('node', [bin, 'https://example.com', '--trace-full'])
  const payload = JSON.parse(stdout)
  t.truthy(payload.request.url)
  t.truthy(payload.response)
  t.false(stderr.includes('SUCCESS'))
})

test('trace rejects search and function', async t => {
  const search = await t.throwsAsync(() => $('node', [bin, 'search', 'coffee', '--trace']))
  t.true(search.stderr.includes('not supported'))
  const run = await t.throwsAsync(() => $('node', [bin, 'function', 'https://example.com', '--trace']))
  t.true(run.stderr.includes('not supported'))
})

test('markdown prints the raw string', async t => {
  const { stdout } = await $('node', [bin, 'markdown', 'https://example.com'])
  t.true(stdout.length > 0)
})

test('links prints an array', async t => {
  const { stdout } = await $('node', [bin, 'links', 'https://microlink.io'])
  t.true(stdout.includes('success'))
  t.true(stdout.includes('http'))
})

test('network failures report the underlying cause', async t => {
  const server = http.createServer((req, res) => res.socket.destroy())
  t.teardown(() => new Promise(resolve => server.close(resolve)))
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const endpoint = `http://127.0.0.1:${server.address().port}`

  const error = await t.throwsAsync(() =>
    $('node', [bin, 'https://example.com', '--endpoint', endpoint])
  )

  t.true(error.stderr.includes('ERROR'))
  t.true(error.stderr.includes('other side closed'))
  t.false(error.stderr.includes('Request failed due to a network error'))
})

const runRaw = (args, env) =>
  new Promise(resolve => {
    const child = spawn('node', args, { env: { ...process.env, ...env } })
    let stderr = ''
    child.stderr.on('data', chunk => (stderr += chunk))
    child.on('close', () => resolve(stderr))
  })

const listenProxyNeeded = async t => {
  const server = http.createServer((req, res) => {
    res.statusCode = 403
    res.setHeader('content-type', 'application/json')
    res.end(
      JSON.stringify({
        status: 'fail',
        data: { url: 'The URL uses antibot protection. Upgrade to a PRO plan.' },
        code: 'EPROXYNEEDED',
        more: 'https://microlink.io/eproxyneeded',
        message:
          'The request has been not processed. See the errors above to know why.'
      })
    )
  })
  t.teardown(() => new Promise(resolve => server.close(resolve)))
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  return `http://127.0.0.1:${server.address().port}`
}

test('4xx errors report the reason and the code from the API', async t => {
  const endpoint = await listenProxyNeeded(t)

  const error = await t.throwsAsync(() =>
    $('node', [bin, 'https://example.com', '--endpoint', endpoint], {
      env: { ...process.env, FORCE_HYPERLINK: '0' }
    })
  )

  t.true(error.stderr.includes('uses antibot protection'))
  t.false(error.stderr.includes('See the errors above'))
  t.true(error.stderr.includes('EPROXYNEEDED (403)'))
  t.true(error.stderr.includes('   more https://microlink.io/eproxyneeded'))
  t.false(error.stderr.includes('\u001b]8;;'))
})

test('a terminal with hyperlinks gets the docs url as a link', async t => {
  const endpoint = await listenProxyNeeded(t)

  const error = await t.throwsAsync(() =>
    $('node', [bin, 'https://example.com', '--endpoint', endpoint], {
      env: { ...process.env, FORCE_HYPERLINK: '1' }
    })
  )

  const url = 'https://microlink.io/eproxyneeded'
  t.true(
    error.stderr.includes(`\u001b]8;;${url}\u0007${url}\u001b]8;;\u0007`)
  )
})

test('every reason reported by the API is printed, aligned', async t => {
  const server = http.createServer((req, res) => {
    res.statusCode = 422
    res.setHeader('content-type', 'application/json')
    res.end(
      JSON.stringify({
        status: 'fail',
        data: {
          url: 'The url is not valid.',
          screenshot: 'The screenshot is not available.'
        },
        code: 'EINVALPARAM',
        message: 'The request has been not processed.'
      })
    )
  })
  t.teardown(() => new Promise(resolve => server.close(resolve)))
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const endpoint = `http://127.0.0.1:${server.address().port}`

  const stderr = await runRaw([
    bin,
    'https://example.com',
    '--endpoint',
    endpoint
  ])

  const [first, second] = stderr.split('\n')
  t.is(first, ' FAIL  The url is not valid.')
  t.is(second, '       The screenshot is not available.')
})

const configHome = apiKey => {
  const dir = mkdtempSync(path.join(tmpdir(), 'microlink-'))
  mkdirSync(path.join(dir, 'microlink'))
  if (apiKey != null) {
    writeFileSync(
      path.join(dir, 'microlink', 'config.json'),
      JSON.stringify({ apiKey })
    )
  }
  const env = { ...process.env, XDG_CONFIG_HOME: dir }
  delete env.MICROLINK_API_KEY
  return { dir, env }
}

const listenSuccess = async t => {
  const seen = { header: null }
  const server = http.createServer((req, res) => {
    seen.header = req.headers['x-api-key']
    res.statusCode = 200
    res.setHeader('content-type', 'application/json')
    res.end(
      JSON.stringify({
        status: 'success',
        data: { title: 'Example', url: 'https://example.com' }
      })
    )
  })
  t.teardown(() => new Promise(resolve => server.close(resolve)))
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  return { endpoint: `http://127.0.0.1:${server.address().port}`, seen }
}

test('logout removes the saved config file', async t => {
  const { dir, env } = configHome('file-key-1')
  const file = path.join(dir, 'microlink', 'config.json')
  t.true(existsSync(file))
  const { stderr } = await $('node', [bin, 'logout'], { env })
  t.true(stderr.includes('Logged out'))
  t.false(existsSync(file))
})

test('logout is a no-op when nothing is saved', async t => {
  const { env } = configHome()
  const { stderr } = await $('node', [bin, 'logout'], { env })
  t.true(stderr.includes('Already logged out'))
})

test('api key resolution is flag over env over config file', async t => {
  const { endpoint, seen } = await listenSuccess(t)
  const { env } = configHome('FILEKEY123')

  await $('node', [
    bin,
    'https://example.com',
    '--endpoint',
    endpoint,
    '--trace'
  ], { env })
  t.is(seen.header, 'FILEKEY123')

  await $('node', [
    bin,
    'https://example.com',
    '--endpoint',
    endpoint,
    '--trace'
  ], { env: { ...env, MICROLINK_API_KEY: 'ENVKEY1234' } })
  t.is(seen.header, 'ENVKEY1234')

  await $('node', [
    bin,
    'https://example.com',
    '--endpoint',
    endpoint,
    '--trace',
    '--api-key',
    'FLAGKEY123'
  ], { env: { ...env, MICROLINK_API_KEY: 'ENVKEY1234' } })
  t.is(seen.header, 'FLAGKEY123')
})

test('429 points at microlink login', async t => {
  const server = http.createServer((req, res) => {
    res.statusCode = 429
    res.setHeader('content-type', 'application/json')
    res.end(
      JSON.stringify({
        status: 'fail',
        data: { url: 'Rate limit exceeded.' },
        code: 'ERATE',
        message: 'The request has been not processed.'
      })
    )
  })
  t.teardown(() => new Promise(resolve => server.close(resolve)))
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const endpoint = `http://127.0.0.1:${server.address().port}`

  const error = await t.throwsAsync(() =>
    $('node', [bin, 'https://example.com', '--endpoint', endpoint])
  )
  t.true(error.stderr.includes('microlink login'))
})
