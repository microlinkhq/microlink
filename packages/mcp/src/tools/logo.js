import { logoInputSchema } from '../schemas.js'
import { register, urlMethod } from './register.js'

export function logo (server) {
  register(
    server,
    'microlink_logo',
    'Brand logo of a public URL as an asset. Null when none is detected.',
    logoInputSchema,
    urlMethod('logo')
  )
}
