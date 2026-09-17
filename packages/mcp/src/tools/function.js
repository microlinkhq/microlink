import { functionInputSchema } from '../schemas.js'
import { INTERACTIVE_ANNOTATIONS, register } from './register.js'

export function fn (server) {
  register(
    server,
    'microlink_function',
    "Run JavaScript against a URL in Microlink's browser sandbox. Pass `code`; returns `{ isFulfilled, value }`.",
    functionInputSchema,
    (client, { url, code, ...options }) => client.function(url, code, options),
    INTERACTIVE_ANNOTATIONS
  )
}
