import { linksInputSchema } from '../schemas.js'
import { register, urlMethod } from './register.js'

export function links (server) {
  register(
    server,
    'microlink_links',
    'Every absolute link URL on the page.',
    linksInputSchema,
    urlMethod('links')
  )
}
