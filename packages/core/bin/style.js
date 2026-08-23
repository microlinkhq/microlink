'use strict'

const { styleText } = require('node:util')

const gray = str => styleText('gray', str)
const white = str => styleText('white', str)
const green = str => styleText('green', str)
const red = str => styleText('red', str)

const ORANGE_256 = '\u001b[38;5;208m'
const DEFAULT_FOREGROUND = '\u001b[39m'

const orange = str =>
  process.stdout.hasColors?.()
    ? `${ORANGE_256}${str}${DEFAULT_FOREGROUND}`
    : String(str)

module.exports = { gray, white, green, red, orange, styleText }
