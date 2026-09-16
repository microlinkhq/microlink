'use strict'

const { writeConfig, readApiKey, configPathDisplay } = require('./config')
const { dashboardUrl, authorize, debugResponse } = require('./dashboard')
const select = require('./select')
const { gray } = require('./style')

const fetchKeys = async token => {
  const path = '/api/v1/connect/keys'
  const res = await fetch(new URL(path, dashboardUrl()), {
    headers: { authorization: `Bearer ${token}` }
  })
  const body = await res.json().catch(() => ({}))
  debugResponse('GET', path, res.status, body)
  if (!res.ok) {
    throw new Error(`Could not load API keys (${res.status})`)
  }
  return Array.isArray(body) ? body : body.keys
}

const asChoice = key => ({
  name: key.label,
  hint: key.maskedKey,
  value: key.apiKey
})

const login = async () => {
  const { token } = await authorize()
  const keys = await fetchKeys(token)
  if (!keys?.length) {
    throw new Error(
      `No API keys on this account. Create a plan at ${dashboardUrl()}/plans`
    )
  }

  const choices = keys.map(asChoice)
  const picked =
    choices.length === 1
      ? choices[0]
      : await select({
        message: 'Which API key?',
        choices,
        current: readApiKey()
      })

  writeConfig({ apiKey: picked.value })
  process.stderr.write(
    `\n${gray('Saved')} ${picked.name} ${gray(`to ${configPathDisplay()}`)}\n`
  )
}

module.exports = login
