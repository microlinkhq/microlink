import { metadataInputSchema } from '../schemas.js'
import { register, urlMethod } from './register.js'

export function metadata (server) {
  register(
    server,
    'microlink_metadata',
    'Normalized metadata from a public URL (`title`, `description`, `image`, `logo`, ...).',
    metadataInputSchema,
    urlMethod('metadata')
  )
}
