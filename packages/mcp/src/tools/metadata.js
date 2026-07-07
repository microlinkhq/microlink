import { metadataInputSchema } from '../schemas.js'
import { register, urlMethod } from './register.js'

export function metadata (server) {
  register(
    server,
    'microlink_metadata',
    [
      'Extract normalized metadata from any public URL via Microlink.',
      'Returns the metadata object: `title`, `description`, `lang`, `author`, `publisher`, `date`, `url`, `image` (with dimensions and file info), and `logo`.',
      'Pass `meta: false` to skip extraction, or a config object to include/exclude fields (e.g. `{ logo: true, title: true }`).',
      'Mirrors the `microlink.metadata(url)` library method.'
    ].join(' '),
    metadataInputSchema,
    urlMethod('metadata')
  )
}
