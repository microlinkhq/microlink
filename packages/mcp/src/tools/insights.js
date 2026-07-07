import { insightsInputSchema } from '../schemas.js'
import { register } from './register.js'

export function insights (server) {
  register(
    server,
    'microlink_insights',
    [
      'Get web performance and technology-stack insights for any URL via Microlink.',
      'Pass `insights: true` for defaults or `insights: { ... }` for options; `insights: {}` is treated as `true`.',
      'Use `insights.lighthouse` (true or config object) for a Lighthouse performance audit.',
      '  - `insights.lighthouse.output`: report format — "json" (default), "html", or "csv".',
      '  - `insights.lighthouse.preset`: "default", "desktop", "perf", "experimental", "full", "lr-desktop", "lr-mobile".',
      '  - `insights.lighthouse.onlyCategories`: array of category IDs to include (e.g. ["performance", "accessibility"]).',
      'Use `insights.technologies` (true) to detect the technology stack (frameworks, CDNs, analytics, etc.) via Wappalyzer.',
      'Both can be combined in a single request.'
    ].join(' '),
    insightsInputSchema,
    { insights: true, meta: false }
  )
}
