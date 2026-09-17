import { textInputSchema } from '../schemas.js'
import { register, urlMethod } from './register.js'

export function text (server) {
  register(
    server,
    'microlink_text',
    'Readable page text as a string. For custom CSS/MQL fields, use microlink_extract.',
    textInputSchema,
    urlMethod('text')
  )
}
