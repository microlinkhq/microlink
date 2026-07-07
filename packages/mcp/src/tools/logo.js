import { logoInputSchema } from '../schemas.js'
import { register } from './register.js'

export function logo (server) {
  register(
    server,
    'microlink_logo',
    [
      'Extract the brand logo of any public URL via Microlink.',
      'Returns the logo asset in `data.logo`: `url`, `type`, `width`, `height`, `size`, and `size_pretty`.',
      'Pass `square: true` to prefer a square (icon-shaped) logo variant.',
      'Mirrors the `microlink.logo(url, { square })` library method.'
    ].join(' '),
    logoInputSchema,
    {},
    // Logo is a metadata field. Mirror `microlink.logo`: request metadata (the
    // API default) and, when `square` is given, scope it to `meta.logo.square`.
    ({ square, ...rest }) => ({
      ...rest,
      meta: square === undefined ? true : { logo: { square } }
    })
  )
}
