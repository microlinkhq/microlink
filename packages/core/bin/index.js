#!/usr/bin/env node
'use strict'

const { styleText } = require('node:util')
const { readFileSync } = require('fs')
const path = require('path')
const mri = require('mri')

const create = require('../src')

const SHOW_CURSOR = '\u001b[?25h'
const HIDE_CURSOR = '\u001b[?25l'
const CLEAR_LINE = '\r\u001b[K'
const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

const gray = str => styleText('gray', str)
const white = str => styleText('white', str)
const green = str => styleText('green', str)
const red = str => styleText('red', str)
const label = (text, color) =>
  styleText(['inverse', 'bold', color], ` ${text.toUpperCase()} `)
const keyValue = (key, value) => key + ' ' + gray(value)

const prettyMs = ms => {
  if (!Number.isFinite(ms)) return 'unknown'
  const sign = ms < 0 ? '-' : ''
  let n = Math.abs(ms)
  if (n < 1000) return `${sign}${Math.round(n)}ms`
  n /= 1000
  if (n < 60) return `${sign}${n.toFixed(1).replace(/\.0$/, '')}s`
  const hours = Math.floor(n / 3600)
  n %= 3600
  const mins = Math.floor(n / 60)
  const secs = (n % 60).toFixed(1).replace(/\.0$/, '')
  if (hours) return `${sign}${hours}h ${mins}m ${secs}s`
  return secs === '0' ? `${sign}${mins}m` : `${sign}${mins}m ${secs}s`
}

const prettyBytes = n => {
  if (!Number.isFinite(n) || n < 1000) return `${Math.round(n || 0)} B`
  if (n < 1e6) {
    const val = n / 1000
    return `${
      val >= 100 ? Math.round(val) : val.toFixed(1).replace(/\.0$/, '')
    } kB`
  }
  return `${(n / 1e6).toFixed(1).replace(/\.0$/, '')} MB`
}

const toPlainHeaders = headers => {
  if (!headers) return {}
  if (typeof headers.entries === 'function') {
    return Object.fromEntries(headers.entries())
  }
  return headers
}

const humanizeApiKey = apiKey => `${String(apiKey).slice(0, 5)}…`

const quote = str =>
  gray('"') + white(JSON.stringify(str).slice(1, -1)) + gray('"')

const printPretty = (value, indent = 0) => {
  if (value === null) return white('null')
  if (typeof value === 'string') return quote(value)
  if (typeof value !== 'object') return white(String(value))

  const isArray = Array.isArray(value)
  const keys = isArray ? value : Object.keys(value)
  if (keys.length === 0) return gray(isArray ? '[]' : '{}')

  const pad = '  '.repeat(indent)
  const inner = '  '.repeat(indent + 1)
  const open = gray(isArray ? '[' : '{')
  const close = gray(isArray ? ']' : '}')
  const lines = keys.map(key => {
    if (isArray) return inner + printPretty(key, indent + 1)
    const name = /^[A-Za-z_$][\w$]*$/.test(key) ? white(key) : quote(key)
    return inner + name + gray(':') + ' ' + printPretty(value[key], indent + 1)
  })
  return open + '\n' + lines.join(gray(',') + '\n') + '\n' + pad + close
}

const printJson = payload => {
  console.log(
    process.stdout.hasColors?.()
      ? printPretty(payload)
      : JSON.stringify(payload, null, 2)
  )
}

const tracePayload = ({
  requestUrl,
  requestOptions = {},
  response,
  full = false
}) => {
  const rest = { ...requestOptions }
  delete rest.responseType
  const headers = { ...rest.headers }
  if (!full && headers['x-api-key']) {
    headers['x-api-key'] = humanizeApiKey(headers['x-api-key'])
  }
  return {
    request: { url: requestUrl, ...rest, headers },
    response: {
      ...response,
      headers: toPlainHeaders(response?.headers)
    }
  }
}

const shouldSpin = () =>
  !process.env.NO_COLOR &&
  process.env.FORCE_COLOR !== '0' &&
  Boolean(process.stdout?.hasColors?.())

const spinner = () => {
  const now = Date.now()
  let i = 0
  let timer
  const draw = () => {
    process.stderr.write(
      `${CLEAR_LINE}${FRAMES[i++ % FRAMES.length]} ${prettyMs(
        Date.now() - now
      )}`
    )
  }
  return {
    start () {
      process.stderr.write(HIDE_CURSOR)
      draw()
      process.on('SIGINT', () => {
        process.stderr.write(CLEAR_LINE + SHOW_CURSOR)
        process.exit(130)
      })
      timer = setInterval(draw, 50)
    },
    stop () {
      clearInterval(timer)
      process.stderr.write(CLEAR_LINE + SHOW_CURSOR)
    }
  }
}

const printFooter = ({ duration, response }) => {
  const headers = toPlainHeaders(response?.headers)
  const time = prettyMs(duration)
  const size = Number(headers['content-length']) || 0
  const serverTiming = headers['server-timing']
  const id = headers['x-request-id']
  const edgeCacheStatus = headers['cf-cache-status']
  const unifiedCacheStatus = headers['x-cache-status']
  const cacheStatus =
    unifiedCacheStatus === 'MISS' && edgeCacheStatus === 'HIT'
      ? edgeCacheStatus
      : unifiedCacheStatus
  const timestamp = Number(headers['x-timestamp'])
  const ttl = Number(headers['x-cache-ttl'])
  const expires = timestamp + ttl - Date.now()
  const expiredAt =
    cacheStatus === 'HIT' && Number.isFinite(expires)
      ? `(${prettyMs(expires)})`
      : ''
  const fetchMode = headers['x-fetch-mode']
  const fetchTime = fetchMode && `(${headers['x-fetch-time']})`
  const uri = response?.url

  if (process.stdout.isTTY) console.error()
  console.error(
    label('success', 'green'),
    gray(`${prettyBytes(size)} in ${time}`)
  )
  console.error()

  if (serverTiming) {
    console.error('  ', keyValue(green('timing'), serverTiming))
  }
  if (cacheStatus) {
    console.error(
      '   ',
      keyValue(green('cache'), `${cacheStatus} ${gray(expiredAt)}`.trim())
    )
  }
  if (fetchMode) {
    console.error(
      '    ',
      keyValue(green('mode'), `${fetchMode} ${gray(fetchTime)}`.trim())
    )
  }
  if (uri) console.error('     ', keyValue(green('uri'), uri))
  if (id) console.error('      ', keyValue(green('id'), id))
}

const printFail = error => {
  if (process.stdout.isTTY) console.error()
  console.error(
    label(error.status || 'fail', 'red'),
    gray(String(error.message).replace(`${error.code}, `, ''))
  )
  console.error()
  const id = error.headers?.['x-request-id']
  if (id) console.error('    ', keyValue(red('id'), id))
  if (error.url) console.error('   ', keyValue(red('uri'), error.url))
  if (error.code) {
    console.error(
      '  ',
      keyValue(
        red('code'),
        `${error.code}${error.statusCode ? ` (${error.statusCode})` : ''}`
      )
    )
  }
  if (error.more) console.error('  ', keyValue(red('more'), error.more))
}

const showHelp = () => {
  console.log(readFileSync(path.join(__dirname, 'help.txt'), 'utf8'))
  process.exit(0)
}

const HTTP_HEADER = 'http.header.'

const parseHeaders = input => {
  const headers = {}
  for (const item of [].concat(input ?? [])) {
    const index = String(item).indexOf(':')
    if (index === -1) continue
    headers[String(item).slice(0, index).trim().toLowerCase()] = String(item)
      .slice(index + 1)
      .trim()
  }
  return headers
}

const takeHttpHeaders = flags => {
  const headers = {}
  for (const key of Object.keys(flags)) {
    if (!key.startsWith(HTTP_HEADER)) continue
    headers[key.slice(HTTP_HEADER.length).toLowerCase()] = flags[key]
    delete flags[key]
  }
  return headers
}

const argv = mri(process.argv.slice(2), {
  alias: { H: 'header' },
  boolean: ['trace', 'trace-full'],
  string: ['header', 'api-key', 'data', 'file', 'endpoint']
})

let {
  _: [command, target],
  header,
  help,
  data,
  file,
  'api-key': apiKeyFlag,
  apiKey: apiKeyCamel,
  endpoint: endpointFlag,
  trace,
  'trace-full': traceFull,
  ...flags
} = argv

const isTrace = trace || traceFull

if (help || !command) showHelp()

const apiKey = apiKeyFlag || apiKeyCamel || process.env.MICROLINK_API_KEY
const endpoint = endpointFlag
const client = create({
  ...(apiKey && { apiKey }),
  ...(endpoint && { endpoint })
})

if (typeof client[command] !== 'function') {
  if (!target && URL.canParse(command)) {
    target = command
    command = 'metadata'
  } else {
    console.error(
      `Unknown command \`${command}\`. Run \`microlink --help\` to see the available commands.`
    )
    process.exit(1)
  }
}

if (
  isTrace &&
  (command === 'search' || command === 'function' || command === 'run')
) {
  console.error(`\`--trace\` is not supported for \`${command}\`.`)
  process.exit(1)
}

const options = { ...flags }
const headers = { ...takeHttpHeaders(options), ...parseHeaders(header) }
if (Object.keys(headers).length > 0) options.headers = headers

const invoke = () => {
  if (command === 'extract') {
    return client.extract(target, JSON.parse(data), options)
  }
  if (command === 'function' || command === 'run') {
    const code = readFileSync(path.resolve(file), 'utf8')
    return client.function(target, code, options)
  }
  return client[command](target, options)
}

const spin = !isTrace && shouldSpin() ? spinner() : null

;(async () => {
  spin?.start()
  const started = Date.now()
  try {
    const result = await invoke()
    const duration = Date.now() - started
    spin?.stop()
    if (isTrace) printJson(tracePayload({ ...client.last, full: traceFull }))
    else if (typeof result === 'string') console.log(result)
    else printJson({ status: 'success', data: result })
    if (!isTrace) printFooter({ duration, response: client.last.response })
    process.exit(0)
  } catch (error) {
    spin?.stop()
    printFail(error)
    process.exit(1)
  }
})()
