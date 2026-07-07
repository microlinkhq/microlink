import { audiosInputSchema } from '../schemas.js'
import { register } from './register.js'

export function audios (server) {
  register(
    server,
    'microlink_audios',
    [
      'Extract every audio source (`<audio>`, `<source>`) from any public URL via Microlink.',
      'Returns an array of absolute, deduped audio URLs under `data.audios`.',
      'Mirrors the `microlink.audios(url)` library method. For the primary playable audio, use `microlink_audio`.'
    ].join(' '),
    audiosInputSchema,
    {
      data: {
        audios: {
          selectorAll: ['audio[src]', 'audio source[src]'],
          attr: 'src',
          type: 'url'
        }
      },
      meta: false
    }
  )
}
