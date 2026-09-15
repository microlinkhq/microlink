import { getCheckoutSession } from '../dashboard-client.js'
import { getCheckoutSessionInputSchema } from '../schemas.js'
import { register } from './register.js'

export function checkoutStatus (server) {
  register(
    server,
    'microlink_get_checkout_session',
    [
      'Get the current state of a Microlink Checkout Session: `open`, `expired`, `paid`, or `ready`.',
      'After giving the human the `checkoutUrl`, poll this tool at a reasonable interval until `ready`; stop if it becomes `expired`.',
      '`paid` means payment succeeded while onboarding is still creating the API key.',
      'A `ready` result includes `keyId`: treat it as a sensitive credential, do not log or expose it, and store it in the caller’s secure credential store.'
    ].join(' '),
    getCheckoutSessionInputSchema,
    (_client, input) => getCheckoutSession(input)
  )
}
