import { technologiesInputSchema } from '../schemas.js'
import { register } from './register.js'

export function technologies (server) {
  register(
    server,
    'microlink_technologies',
    [
      'Detect the technology stack behind any public URL via Microlink (Wappalyzer).',
      'Returns an array of detected technologies (frameworks, CDNs, analytics, e-commerce, etc.) under `data.insights.technologies`.',
      'Mirrors the `microlink.technologies(url)` library method.'
    ].join(' '),
    technologiesInputSchema,
    { insights: { technologies: true, lighthouse: false }, meta: false }
  )
}
