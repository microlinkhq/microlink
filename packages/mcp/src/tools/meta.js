import { metaInputSchema } from '../schemas.js'
import { register } from './register.js'

export function meta (server) {
  register(
    server,
    'microlink_meta',
    [
      'Extract normalized metadata from any public URL via Microlink.',
      'Returns: `title`, `description`, `lang`, `author`, `publisher`, `date`, `url`, `image` (with dimensions and file info), and `logo` (publisher favicon).',
      'Pass `meta: false` to skip metadata extraction entirely — useful when you only need a screenshot or video and want a faster response.',
      'Pass a config object to include or exclude specific fields: `{ logo: true, title: true }` returns only those fields; `{ image: false }` returns everything except image.'
    ].join(' '),
    metaInputSchema,
    { meta: true }
  )
}
