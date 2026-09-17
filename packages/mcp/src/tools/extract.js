import { extractInputSchema } from '../schemas.js'
import { register } from './register.js'

export function extract (server) {
  register(
    server,
    'microlink_extract',
    'Custom MQL data rules on a URL. Not full-page markdown/html/text. Can attach screenshot/pdf/insights on the same request.',
    extractInputSchema,
    (client, { url, data, ...options }) =>
      client.extract(url, data ?? {}, options)
  )
}
