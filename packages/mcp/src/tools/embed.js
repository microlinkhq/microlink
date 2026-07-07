import { embedInputSchema } from '../schemas.js'
import { register } from './register.js'

export function embed (server) {
  register(
    server,
    'microlink_embed',
    [
      'Get the oEmbed-style embeddable iframe for any public URL via Microlink.',
      'Returns `{ html, scripts }` under `data.iframe` — the markup to embed (e.g. a YouTube video, Tweet, or CodePen) plus the script URLs it needs.',
      'Mirrors the `microlink.embed(url)` library method.'
    ].join(' '),
    embedInputSchema,
    { iframe: true, meta: false }
  )
}
