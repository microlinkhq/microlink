import { videosInputSchema } from '../schemas.js'
import { register, urlMethod } from './register.js'

export function videos (server) {
  register(
    server,
    'microlink_videos',
    [
      'Collect every video source (`<video>`, `<source>`) from any public URL via Microlink.',
      'Returns an array of absolute, deduped video URLs.',
      'Mirrors the `microlink.videos(url)` library method. For the primary playable video, use `microlink_video`.'
    ].join(' '),
    videosInputSchema,
    urlMethod('videos')
  )
}
