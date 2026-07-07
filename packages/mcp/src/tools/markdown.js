import { markdownInputSchema } from '../schemas.js'
import { register, urlMethod } from './register.js'

export function markdown (server) {
  register(
    server,
    'microlink_markdown',
    [
      'Convert any public URL to Markdown via Microlink.',
      'Returns the page content as a Markdown string. Pass `selector` to scope it to part of the page.',
      'Mirrors the `microlink.markdown(url)` library method.'
    ].join(' '),
    markdownInputSchema,
    urlMethod('markdown')
  )
}
