'use strict'

const CODES = {
  bold: ['1', '22'],
  inverse: ['7', '27'],
  gray: ['90', '39'],
  white: ['37', '39'],
  green: ['32', '39'],
  red: ['31', '39']
}

const useColor = () => {
  if (typeof process === 'undefined' || !process.stdout) return true
  return Boolean(process.stdout.hasColors?.())
}

const wrap = (open, close, str) =>
  useColor() ? `\u001b[${open}m${str}\u001b[${close}m` : String(str)

const styleText = (format, str) =>
  [].concat(format).reduceRight((value, name) => {
    const pair = CODES[name]
    return pair ? wrap(pair[0], pair[1], value) : value
  }, String(str))

const gray = str => styleText('gray', str)
const white = str => styleText('white', str)
const green = str => styleText('green', str)
const red = str => styleText('red', str)

const ORANGE_256 = '\u001b[38;5;208m'
const DEFAULT_FOREGROUND = '\u001b[39m'

const orange = str =>
  useColor() ? `${ORANGE_256}${str}${DEFAULT_FOREGROUND}` : String(str)

const shouldHyperlink = () => {
  if (typeof process === 'undefined') return true
  if (process.env.FORCE_HYPERLINK === '1') return true
  if (process.env.FORCE_HYPERLINK === '0') return false
  return Boolean(process.stderr?.isTTY)
}

const link = url =>
  shouldHyperlink()
    ? `\u001b]8;;${url}\u0007${url}\u001b]8;;\u0007`
    : String(url)

module.exports = { gray, white, green, red, orange, link, styleText }
