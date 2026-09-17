import { imagesInputSchema } from '../schemas.js'
import { register, urlMethod } from './register.js'

export function images (server) {
  register(
    server,
    'microlink_images',
    'Every absolute image URL on the page.',
    imagesInputSchema,
    urlMethod('images')
  )
}
