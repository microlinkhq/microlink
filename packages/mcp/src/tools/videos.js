import { videosInputSchema } from '../schemas.js'
import { register } from './register.js'

export function videos (server) {
  register(
    server,
    'microlink_videos',
    [
      'Extract every video source (`<video>`, `<source>`) from any public URL via Microlink.',
      'Returns an array of absolute, deduped video URLs under `data.videos`.',
      'Mirrors the `microlink.videos(url)` library method. For the primary playable video, use `microlink_video`.'
    ].join(' '),
    videosInputSchema,
    {
      data: {
        videos: {
          selectorAll: ['video[src]', 'video source[src]'],
          attr: 'src',
          type: 'url'
        }
      },
      meta: false
    }
  )
}
