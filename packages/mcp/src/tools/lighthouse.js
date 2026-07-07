import { lighthouseInputSchema } from '../schemas.js'
import { register } from './register.js'

export function lighthouse (server) {
  register(
    server,
    'microlink_lighthouse',
    [
      'Run a Google Lighthouse audit for any public URL via Microlink.',
      'Returns the Lighthouse report (performance, accessibility, best-practices, SEO) under `data.insights.lighthouse`.',
      'Mirrors the `microlink.lighthouse(url)` library method.'
    ].join(' '),
    lighthouseInputSchema,
    { insights: { lighthouse: true, technologies: false }, meta: false }
  )
}
