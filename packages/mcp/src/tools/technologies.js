import { technologiesInputSchema } from '../schemas.js'
import { register, urlMethod } from './register.js'

export function technologies (server) {
  register(
    server,
    'microlink_technologies',
    'Detected tech stack (Wappalyzer) for a public URL.',
    technologiesInputSchema,
    urlMethod('technologies')
  )
}
