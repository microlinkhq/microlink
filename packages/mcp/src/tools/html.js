import { htmlInputSchema } from '../schemas.js'
import { register, urlMethod } from './register.js'

export function html (server) {
  register(
    server,
    'microlink_html',
    'Page HTML as a string. For custom CSS/MQL fields, use microlink_extract.',
    htmlInputSchema,
    urlMethod('html')
  )
}
