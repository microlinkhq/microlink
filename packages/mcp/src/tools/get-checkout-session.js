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
      '`paid` means payment succeeded while provisioning is still linking the API key.',
      '`ready` includes `keyId` (a non-secret key handle used to identify the provisioned key — not the API secret).',
      'These tools never return the API key secret; the human receives it via welcome email or the dashboard.'
    ].join(' '),
    getCheckoutSessionInputSchema,
    (_client, input) => getCheckoutSession(input)
  )
}
