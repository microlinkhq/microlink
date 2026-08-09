import { functionInputSchema } from '../schemas.js'
import { register } from './register.js'

export function fn (server) {
  register(
    server,
    'microlink_function',
    [
      'Run a JavaScript function against any public URL inside Microlink’s server-side browser sandbox.',
      'Pass `code` as the function source (e.g. "async ({ page }) => page.title()"); it receives `{ page, response, ...args }` and its return value comes back in `value`.',
      'Prefer `actions` for ordered interactions before the function runs; legacy `waitForSelector`, `click`, and `scroll` still work.',
      'Also combine with `javascript`, `waitUntil`, `headers`, and `proxy`.',
      'Also returns `isFulfilled`, `profiling`, and `logging`. Mirrors the `microlink.function(url, code)` library method.'
    ].join(' '),
    functionInputSchema,
    (client, { url, code, ...options }) => client.function(url, code, options)
  )
}
