import { videosInputSchema } from '../schemas.js'
import { register, urlMethod } from './register.js'

export function videos (server) {
  register(
    server,
    'microlink_videos',
    'Every video source URL on the page. For the primary playable video, use microlink_video.',
    videosInputSchema,
    urlMethod('videos')
  )
}
