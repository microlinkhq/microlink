import { audiosInputSchema } from '../schemas.js'
import { register, urlMethod } from './register.js'

export function audios (server) {
  register(
    server,
    'microlink_audios',
    [
      'Collect every audio source (`<audio>`, `<source>`) from any public URL via Microlink.',
      'Returns an array of absolute, deduped audio URLs.',
      'Mirrors the `microlink.audios(url)` library method. For the primary playable audio, use `microlink_audio`.'
    ].join(' '),
    audiosInputSchema,
    urlMethod('audios')
  )
}
