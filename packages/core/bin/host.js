'use strict'

const { readFileSync } = require('fs')
const path = require('path')
const { readApiKey, clearConfig } = require('./config')
const login = require('./login')

module.exports = {
  stdout: process.stdout,
  stderr: process.stderr,
  env: process.env,
  get isTTY () {
    return Boolean(process.stdout.isTTY)
  },
  get hasColors () {
    return Boolean(process.stdout.hasColors?.())
  },
  readFile (file) {
    return readFileSync(path.resolve(file), 'utf8')
  },
  readApiKey,
  clearConfig,
  login,
  exit (code) {
    process.exit(code)
  },
  onInterrupt (fn) {
    process.on('SIGINT', fn)
    return () => process.off('SIGINT', fn)
  }
}
