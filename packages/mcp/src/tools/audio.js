import { audioInputSchema } from '../schemas.js'
import { register } from './register.js'

export function audio (server) {
  register(
    server,
    'microlink_audio',
    [
      'Detect and extract playable audio sources from any URL via Microlink.',
      'Works with SoundCloud, Spotify, Mixcloud, and other audio platforms.',
      'The audio URL is in `data.audio.url`. Also returns `type`, `duration`, `size`, `duration_pretty`, and `size_pretty`.',
      'Combine with `proxy` for sites that require it, or with `meta` to suppress metadata extraction.'
    ].join(' '),
    audioInputSchema,
    { audio: true, meta: false }
  )
}
