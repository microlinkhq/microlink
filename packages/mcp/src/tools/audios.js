import { audiosInputSchema } from '../schemas.js'
import { register, urlMethod } from './register.js'

export function audios (server) {
  register(
    server,
    'microlink_audios',
    'Every audio source URL on the page. For the primary playable audio, use microlink_audio.',
    audiosInputSchema,
    urlMethod('audios')
  )
}
