import { textInputSchema } from '../schemas.js'
import { register, urlMethod } from './register.js'

export function text (server) {
  register(
    server,
    'microlink_text',
    [
      'Extract the plain text of any public URL via Microlink.',
      'Returns the readable page text as a string. Pass `selector` to scope it to part of the page.',
      'Combine with browser options such as `javascript`, `waitUntil`, `waitForSelector`, `headers`, and `proxy`.',
      'Mirrors the `microlink.text(url)` library method.'
    ].join(' '),
    textInputSchema,
    urlMethod('text')
  )
}
