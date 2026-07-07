import { textInputSchema } from '../schemas.js'
import { register } from './register.js'

export function text (server) {
  register(
    server,
    'microlink_text',
    [
      'Extract plain text from any public URL via Microlink.',
      'Returns JSON output with plain text content under `data.text`.',
      'Useful for getting raw text content from web pages.'
    ].join(' '),
    textInputSchema,
    { data: { text: { attr: 'text' } }, meta: false }
  )
}
