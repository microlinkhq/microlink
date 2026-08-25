'use strict'

const { homedir } = require('os')
const { join } = require('path')
const {
  mkdirSync,
  readFileSync,
  writeFileSync,
  unlinkSync,
  chmodSync
} = require('fs')

const configDir = () =>
  join(process.env.XDG_CONFIG_HOME || join(homedir(), '.config'), 'microlink')

const configPath = () => join(configDir(), 'config.json')

const configPathDisplay = () => {
  const file = configPath()
  const home = homedir()
  return file.startsWith(home + '/') ? `~${file.slice(home.length)}` : file
}

const readConfig = () => {
  try {
    return JSON.parse(readFileSync(configPath(), 'utf8'))
  } catch {
    return {}
  }
}

const writeConfig = data => {
  mkdirSync(configDir(), { recursive: true, mode: 0o700 })
  writeFileSync(configPath(), JSON.stringify(data) + '\n', { mode: 0o600 })
  chmodSync(configPath(), 0o600)
}

const clearConfig = () => {
  try {
    unlinkSync(configPath())
    return true
  } catch (error) {
    if (error.code === 'ENOENT') return false
    throw error
  }
}

const readApiKey = () => {
  const { apiKey } = readConfig()
  return typeof apiKey === 'string' && apiKey ? apiKey : undefined
}

module.exports = {
  configDir,
  configPath,
  configPathDisplay,
  readConfig,
  writeConfig,
  clearConfig,
  readApiKey
}
