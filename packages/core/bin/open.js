'use strict'

const { spawn } = require('child_process')

module.exports = url => {
  let href
  try {
    href = new URL(url).href
  } catch {
    return
  }
  if (!href.startsWith('https:') && !href.startsWith('http:')) return
  if (href.includes('"')) return

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
