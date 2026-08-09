import { htmlInputSchema } from '../schemas.js'
import { register, urlMethod } from './register.js'

export function html (server) {
  register(
    server,
    'microlink_html',
    [
      'Extract the HTML content of any public URL via Microlink.',
      'Returns the page HTML as a string. Pass `selector` to scope it to part of the page.',
      'Prefer `actions` for ordered interactions (click, wait, fill, …); legacy `waitForSelector` still works.',
      'Also combine with `javascript`, `waitUntil`, `headers`, and `proxy`.',
      'Mirrors the `microlink.html(url)` library method.'
    ].join(' '),
    htmlInputSchema,
    urlMethod('html')
  )
}
