import { load as loadProductDocs } from 'microlink.io/docs'

import { docsInputSchema } from '../schemas.js'
import { register } from './register.js'

export function docs (server) {
  register(
    server,
    'microlink_docs',
    'Canonical parameter docs for a Microlink product. Same markdown as `microlink <product> docs`.',
    docsInputSchema,
    (_client, { product }) => loadProductDocs(product)
  )
}
