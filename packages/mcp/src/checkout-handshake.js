import { createServer } from 'node:http'

const MAX_BODY_BYTES = 4096

function reply (res, status) {
  if (res.writableEnded || res.headersSent) return
  res.writeHead(status)
  res.end()
}

// Local half of the dashboard Connect handshake used by `microlink buy`.
// The human opens `connectUrl`; the signed-in dashboard POSTs `{ state, token }`
// to this loopback server. The token is passed to `onToken` and is not stored here.
export function listenForConnect ({ state, timeoutMs, onToken, onTimeout }) {
  return new Promise((resolve, reject) => {
    const clock = {}

    const server = createServer((req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'content-type')
      res.setHeader('Access-Control-Allow-Private-Network', 'true')

      if (req.method === 'OPTIONS') return reply(res, 204)

      const path = req.url?.split('?')[0]
      if (req.method !== 'POST' || path !== '/') return reply(res, 405)

      const chunks = []
      let size = 0

      req.on('data', chunk => {
        size += chunk.length
        if (size > MAX_BODY_BYTES) {
          reply(res, 413)
          req.destroy()
        } else {
          chunks.push(chunk)
        }
      })

      req.on('end', () => {
        if (res.writableEnded) return

        let body
        try {
          body = JSON.parse(Buffer.concat(chunks).toString() || '{}')
        } catch {
          return reply(res, 400)
        }

        const token = body?.token
        if (
          body?.state !== state ||
          typeof token !== 'string' ||
          token === ''
        ) {
          return reply(res, 400)
        }

        let accepted = false
        try {
          accepted = onToken(token) === true
        } catch {
          return reply(res, 500)
        }

        if (!accepted) return reply(res, 409)

        reply(res, 204)
        close()
      })
    })

    const close = () => {
      if (clock.closed) return
      clock.closed = true
      clearTimeout(clock.timer)
      server.close()
    }

    clock.timer = setTimeout(() => {
      close()
      onTimeout()
    }, timeoutMs)

    server.on('error', error => {
      close()
      reject(error)
    })

    server.listen(0, '127.0.0.1', () => {
      resolve({ port: server.address().port, close })
    })
  })
}
