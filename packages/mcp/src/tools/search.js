import { searchInputSchema } from '../schemas.js'
import { register } from './register.js'

export function search (server) {
  register(
    server,
    'microlink_search',
    [
      'Search Google and get structured results via Microlink (requires an API key).',
      'Returns `results` (title, url, description) plus `knowledgeGraph`, `peopleAlsoAsk`, and `relatedSearches` when available.',
      'Use `type` for a vertical ("search" default, "news", "images", "videos", "places", "maps", "shopping", "scholar", "patents", "autocomplete"), and `limit` / `location` / `period` to refine.',
      'Google search operators (`site:`, `filetype:`, quotes, ...) work as-is. Mirrors the `microlink.search(query)` library method.'
    ].join(' '),
    searchInputSchema,
    (client, { query, ...options }) => client.search(query, options)
  )
}
