import { metadataInputSchema } from '../schemas.js'
import { register } from './register.js'

export function metadata (server) {
  register(
    server,
    'microlink_metadata',
    [
      'Extract normalized metadata from any public URL via Microlink.',
      'Returns: `title`, `description`, `lang`, `author`, `publisher`, `date`, `url`, `image` (with dimensions and file info), and `logo` (publisher favicon).',
      'Pass `meta: false` to skip metadata extraction entirely and get a faster response.',
      'Pass a config object to include or exclude specific fields: `{ logo: true, title: true }` returns only those fields; `{ image: false }` returns everything except image.',
      'Mirrors the `microlink.metadata(url)` library method.'
    ].join(' '),
    metadataInputSchema,
    // No forced flags: metadata is the API default, and the input schema
    // advertises `meta: false` / field-selection objects, so tool input must
    // flow through untouched (forcing `meta: true` would silently ignore it).
    {}
  )
}
