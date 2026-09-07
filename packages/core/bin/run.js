'use strict'

const { createPrint, writeLine, tracePayload } = require('./print')
const { parseHeaders, takeHttpHeaders } = require('./headers')
const spinner = require('./spinner')
const parseArgv = require('./argv')
const helpText = require('./help')
const { asUrl } = require('./url')
const create = require('../src')

const run = async (argvInput, host) => {
  const { stdout, stderr } = host
  const env = host.env ?? {}
  const finish = (code = 0) => host.exit(code)
  const { printJson, printFooter, printFail } = createPrint(host)
  let aborted = false

  const shouldSpin = () =>
    !env.NO_COLOR && env.FORCE_COLOR !== '0' && Boolean(host.hasColors)

  const showHelp = command => {
    writeLine(stdout, helpText(command).trimEnd())
    return finish(0)
  }

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
  } = parseArgv(argvInput)

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

  if ((command === 'function' || command === 'run') && !file) {
    printFail({ message: 'Missing `--file` with the function source code' })
    return finish(1)
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

  const spin =
    !isTrace && shouldSpin()
      ? spinner({
        stderr,
        onInterrupt: host.onInterrupt,
        onAbort () {
          aborted = true
          finish(130)
        }
      })
      : null

  spin?.start()
  const started = Date.now()
  try {
    const result = await invoke()
    if (aborted) return 130
    const duration = Date.now() - started
    spin?.stop()
    if (isTrace) printJson(tracePayload({ ...client.last, full: traceFull }))
    else if (typeof result === 'string') writeLine(stdout, result)
    else printJson({ status: 'success', data: result })
    if (!isTrace) printFooter({ duration, response: client.last.response })
    return finish(0)
  } catch (error) {
    if (aborted) return 130
    spin?.stop()
    printFail(error)
    return finish(1)
  }
}

module.exports = run
module.exports.run = run
module.exports.helpText = helpText
