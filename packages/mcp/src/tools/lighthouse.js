import { lighthouseInputSchema } from '../schemas.js'
import { register, urlMethod } from './register.js'

export function lighthouse (server) {
  register(
    server,
    'microlink_lighthouse',
    'Google Lighthouse report for a public URL.',
    lighthouseInputSchema,
    urlMethod('lighthouse')
  )
}
