const WIDTH = 74

// eslint-disable-next-line no-control-regex
const ANSI_PATTERN = /\u001b\[[0-9;]*m/g
const hasColor = process.stdout.isTTY && process.env.NO_COLOR === undefined

const colors = hasColor
  ? {
      reset: '\x1b[0m',
      bold: '\x1b[1m',
      cyan: '\x1b[36m',
      yellow: '\x1b[33m',
      green: '\x1b[32m',
      gray: '\x1b[90m'
    }
  : {
      reset: '',
      bold: '',
      cyan: '',
      yellow: '',
      green: '',
      gray: ''
    }

function stripAnsi (text) {
  return text.replace(ANSI_PATTERN, '')
}

function borderLine () {
  return `${colors.cyan}+${'-'.repeat(WIDTH - 2)}+${colors.reset}`
}

function contentLine (text = '') {
  const visibleLength = stripAnsi(text).length
  const padded = text + ' '.repeat(Math.max(0, WIDTH - 4 - visibleLength))
  return `${colors.cyan}|${colors.reset} ${padded} ${colors.cyan}|${colors.reset}`
}

const lines = [
  borderLine(),
  contentLine(`${colors.bold}MICROLINK MCP${colors.reset}`),
  contentLine(),
  contentLine(
    `${colors.bold}Free plan:${colors.reset} 50 requests/day included.`
  ),
  contentLine(`${colors.yellow}Need more or unlimited usage?${colors.reset}`),
  contentLine(
    `Get an API key at ${colors.green}https://microlink.io/#pricing${colors.reset}`
  ),
  contentLine(
    `${colors.gray}Tip:${colors.reset} set MICROLINK_API_KEY in your MCP server env.`
  ),
  borderLine()
]

console.log(`\n${lines.join('\n')}\n`)
