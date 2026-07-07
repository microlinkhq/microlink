import { imagesInputSchema } from '../schemas.js'
import { register } from './register.js'

export function images (server) {
  register(
    server,
    'microlink_images',
    [
      'Extract every image (`<img src>`) from any public URL via Microlink.',
      'Returns an array of absolute, deduped image URLs under `data.images`.',
      'Mirrors the `microlink.images(url)` library method.'
    ].join(' '),
    imagesInputSchema,
    {
      data: { images: { selectorAll: 'img', attr: 'src', type: 'url' } },
      meta: false
    }
  )
}
