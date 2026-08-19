#!/usr/bin/env node
'use strict'

const { styleText } = require('node:util')
const { createSpinner } = require('nanospinner')
const restoreCursor = require('restore-cursor')
const prettyBytes = require('pretty-bytes')
const { readFileSync } = require('fs')
const prettyMs = require('pretty-ms')
const path = require('path')
const jsome = require('jsome')
const mri = require('mri')

const create = require('../src')

const gray = str => styleText('gray', str)
const green = str => styleText('green', str)
const label = (text, color) =>
  styleText(['inverse', 'bold', color], ` ${text.toUpperCase()} `)
const keyValue = (key, value) => key + ' ' + gray(value)

const toPlainHeaders = headers => {
  if (!headers) return {}
  if (typeof headers.entries === 'function') {
    return Object.fromEntries(headers.entries())
  }
  return headers
}

const humanizeApiKey = apiKey => `${String(apiKey).slice(0, 5)}…`

const printJson = payload => {
  if (process.stdout.hasColors?.()) jsome(payload)
  else console.log(JSON.stringify(payload, null, 2))
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

const bodySize = body => {
  if (body == null) return 0
  if (typeof body === 'string' || Buffer.isBuffer(body)) {
    return Buffer.byteLength(body)
  }
  if (body instanceof ArrayBuffer) return body.byteLength
  return Buffer.byteLength(JSON.stringify(body))
}

const TICK_INTERVAL = 50

const shouldSpin = () =>
  !process.env.NO_COLOR &&
  process.env.FORCE_COLOR !== '0' &&
  Boolean(process.stdout?.hasColors?.())

const spinner = () => {
  const now = Date.now()
  const elapsedTime = () => prettyMs(Date.now() - now)
  const spin = createSpinner(elapsedTime(), { color: 'white' })
  let timer

  const start = () => {
    console.error()
    spin.start({ text: elapsedTime() })
    process.on('SIGINT', () => {
      restoreCursor()
      process.exit(130)
    })
    timer = setInterval(
      () => spin.update({ text: elapsedTime() }),
      TICK_INTERVAL
    )
  }

  const stop = () => {
    clearInterval(timer)
    spin.clear()
    restoreCursor()
  }

  return { start, stop }
}

const printFooter = ({ duration, response }) => {
  const headers = toPlainHeaders(response?.headers)
  const time = Number.isFinite(duration) ? prettyMs(duration) : 'unknown'
  const size = Number(headers['content-length'] || bodySize(response?.body))
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

jsome.colors = {
  num: 'cyan',
  str: 'green',
  bool: 'red',
  regex: 'blue',
  undef: 'grey',
  null: 'grey',
  attr: 'reset',
  quot: 'gray',
  punc: 'gray',
  brack: 'gray'
}

const showHelp = () => {
  console.log(readFileSync(path.join(__dirname, 'help.txt'), 'utf8'))
  process.exit(0)
}

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

const argv = mri(process.argv.slice(2), {
  alias: { H: 'header' },
  boolean: ['trace', 'trace-full'],
  string: ['header', 'api-key', 'data', 'file']
})

let {
  _: [command, target],
  header,
  help,
  data,
  file,
  'api-key': apiKeyFlag,
  apiKey: apiKeyCamel,
  trace,
  'trace-full': traceFull,
  ...flags
} = argv

const isTrace = trace || traceFull

if (help || !command) showHelp()

const apiKey = apiKeyFlag || apiKeyCamel || process.env.MICROLINK_API_KEY
const client = create(apiKey ? { apiKey } : {})

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

const options = { ...flags }
const headers = parseHeaders(header)
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
    console.error(error.message)
    process.exit(1)
  }
})()
