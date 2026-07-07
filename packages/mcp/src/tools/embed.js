import { embedInputSchema } from '../schemas.js'
import { register, urlMethod } from './register.js'

export function embed (server) {
  register(
    server,
    'microlink_embed',
    [
      'Get the oEmbed-style embeddable iframe for any public URL via Microlink (YouTube, Tweet, CodePen, ...).',
      'Returns `{ html, scripts }` — the markup to embed plus the script URLs it needs.',
      'Pass `maxWidth` / `maxHeight` to constrain the embed size.',
      'Mirrors the `microlink.embed(url)` library method.'
    ].join(' '),
    embedInputSchema,
    urlMethod('embed')
  )
}
