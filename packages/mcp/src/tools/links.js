import { linksInputSchema } from '../schemas.js'
import { register, urlMethod } from './register.js'

export function links (server) {
  register(
    server,
    'microlink_links',
    [
      'Collect every link (`<a href>`) from any public URL via Microlink.',
      'Returns an array of absolute, deduped URLs. Pass `selectorAll` to scope the collection.',
      'Mirrors the `microlink.links(url)` library method.'
    ].join(' '),
    linksInputSchema,
    urlMethod('links')
  )
}
