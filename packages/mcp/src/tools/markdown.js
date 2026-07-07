import { markdownInputSchema } from '../schemas.js'
import { register } from './register.js'

export function markdown (server) {
  register(
    server,
    'microlink_markdown',
    [
      'Convert any public URL to Markdown via Microlink.',
      'Returns JSON output with Markdown content under `data.markdown`.',
      'Useful for extracting readable content from web pages, articles, and documentation.'
    ].join(' '),
    markdownInputSchema,
    { data: { markdown: { attr: 'markdown' } }, meta: false }
  )
}
