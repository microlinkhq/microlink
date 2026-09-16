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

  const { platform } = process
  const child =
    platform === 'win32'
      ? spawn('explorer.exe', [href], { detached: true, stdio: 'ignore' })
      : spawn(platform === 'darwin' ? 'open' : 'xdg-open', [href], {
        detached: true,
        stdio: 'ignore'
      })
  child.on('error', () => {})
  child.unref()
}
