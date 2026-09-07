'use strict'

const mriModule = require('mri')
const mri = typeof mriModule === 'function' ? mriModule : mriModule.default
const helpText = require('./help')
const { gray, white, green, red, orange, link, styleText } = require('./style')

const create = require('../src')

const SHOW_CURSOR = '\u001b[?25h'
const HIDE_CURSOR = '\u001b[?25l'
const CLEAR_LINE = '\r\u001b[K'
const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

const label = (text, color) =>
  styleText(['inverse', 'bold'], color(` ${text.toUpperCase()} `))
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

const httpUrl = value => {
  if (!URL.canParse(value)) return
  const { protocol } = new URL(value)
  if (protocol === 'http:' || protocol === 'https:') return value
}

const asUrl = input => {
  if (typeof input !== 'string' || !input) return
  if (httpUrl(input)) return input
  if (/^[a-z][a-z\d+.-]*:\/\//i.test(input) || !/[.:]/.test(input)) return
  return httpUrl(`https://${input}`)
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
    let value = flags[key]
    delete flags[key]
    if (Array.isArray(value)) value = value.at(-1)
    if (typeof value !== 'string' && typeof value !== 'number') continue
    const name = key.slice(HTTP_HEADER.length).toLowerCase()
    if (name) headers[name] = String(value)
  }
  return headers
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

const run = async (argvInput, host) => {
  const stdout = host.stdout
  const stderr = host.stderr
  const env = host.env ?? {}
  const finish = (code = 0) => host.exit(code)

  const printJson = payload => {
    writeLine(
      stdout,
      host.hasColors ? printPretty(payload) : JSON.stringify(payload, null, 2)
    )
  }

  const shouldSpin = () =>
    !env.NO_COLOR && env.FORCE_COLOR !== '0' && Boolean(host.hasColors)

  const spinner = () => {
    const now = Date.now()
    let i = 0
    let timer
    const draw = () => {
      stderr.write(
        `${CLEAR_LINE}${FRAMES[i++ % FRAMES.length]} ${prettyMs(
          Date.now() - now
        )}`
      )
    }
    return {
      start () {
        stderr.write(HIDE_CURSOR)
        draw()
        host.onInterrupt?.(() => {
          stderr.write(CLEAR_LINE + SHOW_CURSOR)
          finish(130)
        })
        timer = setInterval(draw, 50)
      },
      stop () {
        clearInterval(timer)
        stderr.write(CLEAR_LINE + SHOW_CURSOR)
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
    if (error.url) { writeLine(stderr, '   ', keyValue(color('uri'), link(error.url))) }
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

  const showHelp = command => {
    writeLine(stdout, helpText(command).trimEnd())
    return finish(0)
  }

  const argv = mri(argvInput, {
    alias: { H: 'header' },
    boolean: ['trace', 'trace-full', 'help', 'html', 'markdown'],
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
    html: htmlFlag,
    markdown: markdownFlag,
    ...flags
  } = argv

  const isTrace = trace || traceFull

  if (!command) return showHelp()

  if (command === 'login' || command === 'logout') {
    if (help) return showHelp(command)
    if (command === 'logout') {
      writeLine(
        stderr,
        host.clearConfig() ? 'Logged out.' : 'Already logged out.'
      )
      return finish(0)
    }
    try {
      await host.login()
      return finish(0)
    } catch (error) {
      writeLine(stderr, error.message)
      return finish(error.code === 'ABORT' ? 130 : 1)
    }
  }

  const apiKey =
    apiKeyFlag || apiKeyCamel || env.MICROLINK_API_KEY || host.readApiKey()
  const endpoint = endpointFlag
  const client = create({
    ...(apiKey && { apiKey }),
    ...(endpoint && { endpoint })
  })

  if (typeof client[command] !== 'function') {
    const url = asUrl(command)
    if (!target && url) {
      target = url
      command = 'metadata'
    } else if (help) {
      return showHelp()
    } else {
      writeLine(
        stderr,
        `Unknown command \`${command}\`. Run \`microlink --help\` to see the available commands.`
      )
      return finish(1)
    }
  }

  if (help || !target) return showHelp(command)
  if (command !== 'search') target = asUrl(target) ?? target

  if (
    isTrace &&
    (command === 'search' || command === 'function' || command === 'run')
  ) {
    writeLine(stderr, `\`--trace\` is not supported for \`${command}\`.`)
    return finish(1)
  }

  const options = { ...flags }
  const headers = { ...takeHttpHeaders(options), ...parseHeaders(header) }
  if (Object.keys(headers).length > 0) options.headers = headers

  let rules
  if (command === 'extract') {
    try {
      rules = JSON.parse(data)
    } catch {
      printFail({ message: 'Invalid --data JSON' })
      return finish(1)
    }
  }

  const invoke = () => {
    if (command === 'extract') {
      return client.extract(target, rules, options)
    }
    if (command === 'function' || command === 'run') {
      const code = host.readFile(file)
      return client.function(target, code, options)
    }
    if (command === 'search') {
      return client.search(target, {
        ...options,
        ...(htmlFlag && { html: true }),
        ...(markdownFlag && { markdown: true })
      })
    }
    return client[command](target, options)
  }

  const spin = !isTrace && shouldSpin() ? spinner() : null

  spin?.start()
  const started = Date.now()
  try {
    const result = await invoke()
    const duration = Date.now() - started
    spin?.stop()
    if (isTrace) printJson(tracePayload({ ...client.last, full: traceFull }))
    else if (typeof result === 'string') writeLine(stdout, result)
    else printJson({ status: 'success', data: result })
    if (!isTrace) printFooter({ duration, response: client.last.response })
    return finish(0)
  } catch (error) {
    spin?.stop()
    printFail(error)
    return finish(1)
  }
}

module.exports = run
module.exports.run = run
module.exports.helpText = helpText
