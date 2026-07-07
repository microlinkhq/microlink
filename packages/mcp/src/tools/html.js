import { htmlInputSchema } from '../schemas.js'
import { register } from './register.js'

export function html (server) {
  register(
    server,
    'microlink_html',
    [
      'Extract the HTML content of any public URL via Microlink.',
      'Returns the HTML content under `data.html`.',
      'Mirrors the `microlink.html(url)` library method.'
    ].join(' '),
    htmlInputSchema,
    { data: { html: { attr: 'html' } }, meta: false }
  )
}
