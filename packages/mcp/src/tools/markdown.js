import { markdownInputSchema } from '../schemas.js'
import { register, urlMethod } from './register.js'

export function markdown (server) {
  register(
    server,
    'microlink_markdown',
    'Page content as Markdown. For custom CSS/MQL fields, use microlink_extract.',
    markdownInputSchema,
    urlMethod('markdown')
  )
}
