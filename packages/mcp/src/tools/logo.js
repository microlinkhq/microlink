import { logoInputSchema } from '../schemas.js'
import { register, urlMethod } from './register.js'

export function logo (server) {
  register(
    server,
    'microlink_logo',
    [
      'Extract the brand logo of any public URL via Microlink.',
      'Returns the logo asset: `url`, `type`, `width`, `height`, `size`, and `size_pretty`.',
      'Pass `square: true` to prefer a square (icon-shaped) variant.',
      'Mirrors the `microlink.logo(url, { square })` library method.'
    ].join(' '),
    logoInputSchema,
    urlMethod('logo')
  )
}
