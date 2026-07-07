import { linksInputSchema } from '../schemas.js'
import { register } from './register.js'

export function links (server) {
  register(
    server,
    'microlink_links',
    [
      'Extract every link (`<a href>`) from any public URL via Microlink.',
      'Returns an array of absolute, deduped URLs under `data.links`.',
      'Mirrors the `microlink.links(url)` library method.'
    ].join(' '),
    linksInputSchema,
    {
      data: { links: { selectorAll: 'a', attr: 'href', type: 'url' } },
      meta: false
    }
  )
}
