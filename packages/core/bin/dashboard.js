'use strict'

const debug = require('debug-logfmt')('microlink')
const { randomBytes } = require('crypto')
const http = require('http')
const openUrl = require('./open')

const TIMEOUT_MS = 5 * 60 * 1000
const CLOSE_MS = 2000

const dashboardUrl = () =>
  process.env.MICROLINK_DASHBOARD_URL || 'https://dashboard.microlink.io'

const debugResponse = (method, path, status, body) => {
  const fields = { method, path, status }
  for (const [key, value] of Object.entries(body || {})) {
    fields[key] =
      value != null && typeof value === 'object' ? JSON.stringify(value) : value
  }
  debug(fields)
}

const listen = state =>
  new Promise((resolve, reject) => {
    let settle
    const handshake = new Promise((resolve, reject) => {
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
          settle.resolve(body)
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
      resolve({ port: server.address().port, handshake, close })
    })
    server.on('error', reject)
  })

const authorize = async (query = {}) => {
  if (process.env.MICROLINK_CONNECT_TOKEN) {
    return { token: process.env.MICROLINK_CONNECT_TOKEN }
  }

  const state = randomBytes(16).toString('hex')
  const { port, handshake, close } = await listen(state)
  const url = new URL('/connect', dashboardUrl())
  url.searchParams.set('port', String(port))
  url.searchParams.set('state', state)
  for (const [key, value] of Object.entries(query)) {
    if (value != null && value !== '') url.searchParams.set(key, String(value))
  }
  process.stderr.write(`Opening ${url}\n\n`)
  openUrl(url.toString())
  try {
    return await handshake
  } finally {
    setTimeout(close, CLOSE_MS).unref()
  }
}

module.exports = { dashboardUrl, authorize, debugResponse }
