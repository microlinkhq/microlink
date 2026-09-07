'use strict'

const { toPlainHeaders } = require('./headers')
const { prettyMs, prettyBytes } = require('./pretty')
const { gray, white, green, red, orange, link, styleText } = require('./style')

const label = (text, color) =>
  styleText(['inverse', 'bold'], color(` ${text.toUpperCase()} `))
const keyValue = (key, value) => key + ' ' + gray(value)

const quote = str =>
  gray('"') + white(JSON.stringify(str).slice(1, -1)) + gray('"')

const printPretty = (value, indent = 0) => {
  if (value === null) return white('null')
  if (typeof value === 'string') return quote(value)
  if (typeof value !== 'object') return white(String(value))

  const isArray = Array.isArray(value)
  const keys = isArray
    ? value.filter(item => typeof item !== 'function')
    : Object.keys(value).filter(key => typeof value[key] !== 'function')
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

const writeLine = (stream, ...args) => {
  stream.write(args.map(String).join(' ') + '\n')
}

const isClientError = statusCode => statusCode >= 400 && statusCode < 500

const reasons = error => {
  const values = Object.values(error.data ?? {}).filter(
    value => typeof value === 'string'
  )
  return values.length > 0
    ? values
    : [String(error.message).replace(`${error.code}, `, '')]
}

const humanizeApiKey = apiKey => `${String(apiKey).slice(0, 5)}…`

const tracePayload = ({
  requestUrl,
  requestOptions = {},
  response,
  full = false
}) => {
  const rest = { ...requestOptions }
  delete rest.responseType
  const headers = { ...rest.headers }
  if (!full) {
    for (const key of ['x-api-key', 'authorization', 'cookie']) {
      if (headers[key]) headers[key] = humanizeApiKey(headers[key])
    }
  }
  return {
    request: { url: requestUrl, ...rest, headers },
    response: {
      ...response,
      headers: toPlainHeaders(response?.headers)
    }
  }
}

const createPrint = host => {
  const { stdout, stderr } = host

  const printJson = payload => {
    writeLine(
      stdout,
      host.hasColors ? printPretty(payload) : JSON.stringify(payload, null, 2)
    )
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

    if (host.isTTY) writeLine(stderr)
    writeLine(
      stderr,
      label('success', green),
      gray(`${prettyBytes(size)} in ${time}`)
    )
    writeLine(stderr)

    if (serverTiming) {
      writeLine(stderr, '  ', keyValue(green('timing'), serverTiming))
    }
    if (cacheStatus) {
      writeLine(
        stderr,
        '   ',
        keyValue(green('cache'), `${cacheStatus} ${gray(expiredAt)}`.trim())
      )
    }
    if (fetchMode) {
      writeLine(
        stderr,
        '    ',
        keyValue(green('mode'), `${fetchMode} ${gray(fetchTime)}`.trim())
      )
    }
    if (uri) writeLine(stderr, '     ', keyValue(green('uri'), link(uri)))
    if (id) writeLine(stderr, '      ', keyValue(green('id'), id))
  }

  const printFail = error => {
    const color = isClientError(error.statusCode) ? orange : red
    const status = error.status || 'fail'
    const [reason, ...rest] = reasons(error)
    const indent = ' '.repeat(status.length + 2)
    if (host.isTTY) writeLine(stderr)
    writeLine(stderr, label(status, color), gray(reason))
    for (const extra of rest) writeLine(stderr, indent, gray(extra))
    writeLine(stderr)
    const id = error.headers?.['x-request-id']
    if (id) writeLine(stderr, '    ', keyValue(color('id'), id))
    if (error.url) {
      writeLine(stderr, '   ', keyValue(color('uri'), link(error.url)))
    }
    if (error.code) {
      writeLine(
        stderr,
        '  ',
        keyValue(
          color('code'),
          `${error.code}${error.statusCode ? ` (${error.statusCode})` : ''}`
        )
      )
    }
    if (error.more) {
      writeLine(stderr, '  ', keyValue(color('more'), link(error.more)))
    }
    if (error.statusCode === 429) {
      writeLine(
        stderr,
        '  ',
        keyValue(color('hint'), 'run `microlink login` to use an API key')
      )
    }
  }

  return { printJson, printFooter, printFail }
}

module.exports = { createPrint, writeLine, tracePayload }
