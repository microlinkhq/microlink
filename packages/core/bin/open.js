'use strict'

const { spawn } = require('child_process')

const asHttpUrl = url => {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return
    if (parsed.href.includes('"')) return
    return parsed.href
  } catch {

  }
}

module.exports = url => {
  const href = asHttpUrl(url)
  if (!href) return

  const { platform } = process
  const child =
    platform === 'win32'
      ? spawn('cmd', ['/c', 'start', '""', `"${href}"`], {
        detached: true,
        stdio: 'ignore',
        windowsVerbatimArguments: true
      })
      : spawn(platform === 'darwin' ? 'open' : 'xdg-open', [href], {
        detached: true,
        stdio: 'ignore'
      })
  child.on('error', () => {})
  child.unref()
}
