import { docs as productDocs } from 'microlink.io/cli'

import { docsInputSchema } from '../schemas.js'
import { register } from './register.js'

export function docs (server) {
  register(
    server,
    'microlink_docs',
    [
      'Fetch the canonical, complete parameter documentation for a Microlink product.',
      'Call this before using a product tool whose parameters you do not know well.',
      'Returns the product markdown directly from microlink.io, the same source used by `microlink <product> docs`.'
    ].join(' '),
    docsInputSchema,
    (_client, { product }) => productDocs.load(product)
  )
}
