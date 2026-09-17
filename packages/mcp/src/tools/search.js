import { searchInputSchema } from '../schemas.js'
import { register } from './register.js'

export function search (server) {
  register(
    server,
    'microlink_search',
    'Google as structured data. Takes `query` (not a URL). Requires an API key.',
    searchInputSchema,
    (client, { query, ...options }) => client.search(query, options)
  )
}
