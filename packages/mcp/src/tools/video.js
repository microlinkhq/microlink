import { videoInputSchema } from '../schemas.js'
import { register } from './register.js'

export function video (server) {
  register(
    server,
    'microlink_video',
    [
      'Detect and extract playable video sources from any URL via Microlink.',
      'Works with YouTube, Vimeo, Twitter/X, TikTok, Instagram, Dailymotion, and hundreds of other platforms.',
      'The video URL is in `data.video.url`. Also returns `type`, `duration`, `size`, `width`, `height`, `duration_pretty`, and `size_pretty`.',
      'Combine with `proxy` for sites that require it, or with `meta` to suppress metadata extraction.'
    ].join(' '),
    videoInputSchema,
    { video: true, meta: false }
  )
}
