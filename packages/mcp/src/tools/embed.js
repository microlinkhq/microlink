import { embedInputSchema } from '../schemas.js'
import { register, urlMethod } from './register.js'

export function embed (server) {
  register(
    server,
    'microlink_embed',
    'oEmbed iframe for a URL (`{ html, scripts }`). Null when none is found.',
    embedInputSchema,
    urlMethod('embed')
  )
}
