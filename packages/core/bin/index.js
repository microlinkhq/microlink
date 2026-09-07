#!/usr/bin/env node
'use strict'

const run = require('./run')
const host = require('./host')

run(process.argv.slice(2), host)
