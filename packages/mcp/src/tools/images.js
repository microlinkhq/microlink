import { imagesInputSchema } from '../schemas.js'
import { register, urlMethod } from './register.js'

export function images (server) {
  register(
    server,
    'microlink_images',
    [
      'Collect every image (`<img src>`) from any public URL via Microlink.',
      'Returns an array of absolute, deduped image URLs. Pass `selectorAll` to scope the collection.',
      'Mirrors the `microlink.images(url)` library method.'
    ].join(' '),
    imagesInputSchema,
    urlMethod('images')
  )
}
