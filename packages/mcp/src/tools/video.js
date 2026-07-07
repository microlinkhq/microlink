import { videoInputSchema } from '../schemas.js'
import { register, urlMethod } from './register.js'

export function video (server) {
  register(
    server,
    'microlink_video',
    [
      'Detect the primary playable video of any public URL via Microlink.',
      'Works with YouTube, Vimeo, Twitter/X, TikTok, Instagram, and hundreds of other platforms.',
      'Returns the video asset: `url`, `type`, `duration`, `size`, `width`, `height`, `duration_pretty`, `size_pretty`.',
      'Mirrors the `microlink.video(url)` library method. For every video on the page, use `microlink_videos`.'
    ].join(' '),
    videoInputSchema,
    urlMethod('video')
  )
}
