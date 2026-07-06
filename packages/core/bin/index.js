#!/usr/bin/env node
'use strict'

const { readFileSync } = require('fs')
const path = require('path')
const jsome = require('jsome')
const mri = require('mri')

const create = require('../src')

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
  string: ['header', 'api-key', 'data', 'file']
})

const {
  _: [command, target],
  header,
  help,
  data,
  file,
  'api-key': apiKeyFlag,
  apiKey: apiKeyCamel,
  ...flags
} = argv

if (help || !command) showHelp()

const apiKey = apiKeyFlag || apiKeyCamel || process.env.MICROLINK_API_KEY
const client = create(apiKey ? { apiKey } : {})

if (typeof client[command] !== 'function') {
  console.error(
    `Unknown command \`${command}\`. Run \`microlink --help\` to see the available commands.`
  )
  process.exit(1)
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

Promise.resolve()
  .then(invoke)
  .then(result => {
    if (typeof result === 'string') console.log(result)
    else jsome(result)
    process.exit(0)
  })
  .catch(error => {
    console.error(error.message)
    process.exit(1)
  })
