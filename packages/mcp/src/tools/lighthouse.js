import { lighthouseInputSchema } from '../schemas.js'
import { register, urlMethod } from './register.js'

export function lighthouse (server) {
  register(
    server,
    'microlink_lighthouse',
    [
      'Run a Google Lighthouse audit (performance, accessibility, best-practices, SEO) for any public URL via Microlink.',
      'Returns the Lighthouse report.',
      'Mirrors the `microlink.lighthouse(url)` library method.'
    ].join(' '),
    lighthouseInputSchema,
    urlMethod('lighthouse')
  )
}
