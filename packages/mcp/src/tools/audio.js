import { audioInputSchema } from '../schemas.js'
import { register, urlMethod } from './register.js'

export function audio (server) {
  register(
    server,
    'microlink_audio',
    'Primary playable audio asset. For every audio URL on the page, use microlink_audios.',
    audioInputSchema,
    urlMethod('audio')
  )
}
