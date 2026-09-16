'use strict'

const { spawn } = require('child_process')

module.exports = url => {
  const { platform } = process
  const child =
    platform === 'win32'
      ? spawn('cmd', ['/c', 'start', '""', `"${url}"`], {
        detached: true,
        stdio: 'ignore',
        windowsVerbatimArguments: true
      })
      : spawn(platform === 'darwin' ? 'open' : 'xdg-open', [url], {
        detached: true,
        stdio: 'ignore'
      })
  child.on('error', () => {})
  child.unref()
}
