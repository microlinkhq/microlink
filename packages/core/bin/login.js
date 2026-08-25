'use strict'

const { randomBytes } = require('crypto')
const { spawn } = require('child_process')
const http = require('http')
const { writeConfig, readApiKey, configPathDisplay } = require('./config')
const select = require('./select')
const { gray } = require('./style')

const TIMEOUT_MS = 5 * 60 * 1000

const dashboardUrl = () =>
  process.env.MICROLINK_DASHBOARD_URL || 'https://dashboard.microlink.io'

const openUrl = url => {
  const { platform } = process
  const cmd =
    platform === 'darwin' ? 'open' : platform === 'win32' ? 'cmd' : 'xdg-open'
  const args = platform === 'win32' ? ['/c', 'start', '', url] : [url]
  spawn(cmd, args, { detached: true, stdio: 'ignore' }).unref()
}

const listen = state =>
  new Promise((resolve, reject) => {
    let settle
    const token = new Promise((resolve, reject) => {
      settle = { resolve, reject }
    })

    const cors = res => {
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'content-type')
      res.setHeader('Access-Control-Allow-Private-Network', 'true')
    }

    const server = http.createServer((req, res) => {
      cors(res)
      if (req.method === 'OPTIONS') {
        res.writeHead(204)
        res.end()
        return
      }
      if (req.method !== 'POST') {
        res.writeHead(405)
        res.end()
        return
      }
      const chunks = []
      req.on('data', chunk => chunks.push(chunk))
      req.on('end', () => {
        try {
          const body = JSON.parse(Buffer.concat(chunks).toString())
          if (body.state !== state || typeof body.token !== 'string') {
            res.writeHead(400)
            res.end()
            return
          }
          res.writeHead(204)
          res.end()
          clearTimeout(timer)
          settle.resolve(body.token)
        } catch {
          res.writeHead(400)
          res.end()
        }
      })
    })

    const close = () => {
      clearTimeout(timer)
      server.close()
    }

    const timer = setTimeout(() => {
      close()
      settle.reject(new Error('Timed out waiting for dashboard authorization'))
    }, TIMEOUT_MS)

    server.listen(0, '127.0.0.1', () => {
      resolve({ port: server.address().port, token, close })
    })
    server.on('error', reject)
  })

const fetchKeys = async token => {
  const res = await fetch(new URL('/api/v1/connect/keys', dashboardUrl()), {
    headers: { authorization: `Bearer ${token}` }
  })
  if (!res.ok) {
    throw new Error(`Could not load API keys (${res.status})`)
  }
  const body = await res.json()
  return Array.isArray(body) ? body : body.keys
}

const asChoice = key => ({
  name: key.label,
  hint: key.maskedKey,
  value: key.apiKey
})

const login = async () => {
  const state = randomBytes(16).toString('hex')
  const { port, token: tokenP, close } = await listen(state)
  const url = new URL('/connect', dashboardUrl())
  url.searchParams.set('port', String(port))
  url.searchParams.set('state', state)
  process.stderr.write(`Opening ${url}\n`)
  openUrl(url.toString())

  try {
    const keys = await fetchKeys(await tokenP)
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
  } finally {
    close()
  }
}

module.exports = login
