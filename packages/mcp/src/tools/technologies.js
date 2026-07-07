import { technologiesInputSchema } from '../schemas.js'
import { register, urlMethod } from './register.js'

export function technologies (server) {
  register(
    server,
    'microlink_technologies',
    [
      'Detect the technology stack behind any public URL via Microlink (Wappalyzer).',
      'Returns an array of detected technologies (frameworks, CDNs, analytics, e-commerce, etc.).',
      'Mirrors the `microlink.technologies(url)` library method.'
    ].join(' '),
    technologiesInputSchema,
    urlMethod('technologies')
  )
}
