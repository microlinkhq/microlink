import { extractInputSchema } from '../schemas.js'
import { register } from './register.js'

export function extract (server) {
  register(
    server,
    'microlink_extract',
    [
      'Extract structured metadata from any public URL via Microlink.',
      'Returns normalized fields: title, description, author, publisher, date, image, logo, lang, and url.',
      'Use the `data` parameter to scrape custom fields via CSS selectors (selector/selectorAll, attr, type, evaluate).',
      'Combine with `screenshot`, `pdf`, `video`, `audio`, `insights`, `palette`, `iframe` in a single request.',
      'For `screenshot`, `pdf`, and `insights`, pass `true` to enable defaults or pass a config object with options; `{}` is treated as `true`.',
      'Supports device emulation (`device`), custom headers, proxy, JavaScript injection (`scripts`, `modules`, `function`), interaction (`click`, `scroll`), and caching (`ttl`, `staleTtl`, `force`).',
      'The CDN asset URL for any enabled media feature is in `data.<feature>.url` (e.g. `data.screenshot.url`).'
    ].join(' '),
    extractInputSchema,
    {}
  )
}
