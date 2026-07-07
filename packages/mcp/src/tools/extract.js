import { extractInputSchema } from '../schemas.js'
import { register } from './register.js'

export function extract (server) {
  register(
    server,
    'microlink_extract',
    [
      'Scrape custom fields from any public URL via Microlink using MQL data rules.',
      'Pass `data` with the rules object (selector/selectorAll, attr, type, evaluate; nested rules and arrays supported); returns the extracted `data` object.',
      'Also supports combining capabilities (`screenshot`, `pdf`, `iframe`, `insights`) and browser controls in the same request.',
      'Mirrors the `microlink.extract(url, rules)` library method.'
    ].join(' '),
    extractInputSchema,
    (client, { url, data, ...options }) =>
      client.extract(url, data ?? {}, options)
  )
}
