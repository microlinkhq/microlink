'use strict'

const { createRequire } = require('node:module')
const { dirname, join } = require('node:path')
const { readFileSync, writeFileSync } = require('node:fs')

const requireFromCore = createRequire(join(__dirname, '../package.json'))
const pkgPath = requireFromCore.resolve('puppeteer-core/package.json')
const { types } = requireFromCore(pkgPath)

writeFileSync(
  join(__dirname, '../src/puppeteer-core.d.ts'),
  readFileSync(join(dirname(pkgPath), types), 'utf8')
)
