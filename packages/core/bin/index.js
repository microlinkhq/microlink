#!/usr/bin/env node
'use strict'

const run = require('./run')
const host = require('./host')

run(process.argv.slice(2), host).catch(error => {
  host.stderr.write(`${error?.message ?? error}\n`)
  host.exit(1)
})
