import { getCheckoutSession } from '../dashboard-client.js'
import { getCheckoutSessionInputSchema } from '../schemas.js'
import { register } from './register.js'

export function checkoutStatus (server) {
  register(
    server,
    'microlink_get_checkout_session',
    [
      'Poll a checkout started by `microlink_create_checkout_session`: `open`, `expired`, `paid`, or `ready`.',
      'While the human has not finished Connect, `state` is `open` and `connectUrl` is set.',
      'When `checkoutUrl` appears, give that to the human to pay; do not open or complete it.',
      'Keep polling until `ready`, or stop on `expired`.',
      '`paid` means payment succeeded while provisioning is still linking the API key.',
      '`ready` means the key is provisioned.',
      'These tools never return the API key secret; the human receives it via welcome email or the dashboard.'
    ].join(' '),
    getCheckoutSessionInputSchema,
    (_client, input) => getCheckoutSession(input)
  )
}
