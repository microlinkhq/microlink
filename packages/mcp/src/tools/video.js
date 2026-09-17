import { videoInputSchema } from '../schemas.js'
import { register, urlMethod } from './register.js'

export function video (server) {
  register(
    server,
    'microlink_video',
    'Primary playable video asset. For every video URL on the page, use microlink_videos.',
    videoInputSchema,
    urlMethod('video')
  )
}
