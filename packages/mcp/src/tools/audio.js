import { audioInputSchema } from '../schemas.js'
import { register, urlMethod } from './register.js'

export function audio (server) {
  register(
    server,
    'microlink_audio',
    [
      'Detect the primary playable audio of any public URL via Microlink.',
      'Works with SoundCloud, Spotify, Mixcloud, and other audio platforms.',
      'Returns the audio asset: `url`, `type`, `duration`, `size`, `duration_pretty`, `size_pretty`.',
      'Mirrors the `microlink.audio(url)` library method. For every audio on the page, use `microlink_audios`.'
    ].join(' '),
    audioInputSchema,
    urlMethod('audio')
  )
}
