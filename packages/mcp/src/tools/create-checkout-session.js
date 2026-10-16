import { createCheckoutSession } from '../dashboard-client.js'
import { createCheckoutSessionInputSchema } from '../schemas.js'
import { INTERACTIVE_ANNOTATIONS, register } from './register.js'

export function checkoutCreate (server) {
  register(
    server,
    'microlink_create_checkout_session',
    [
      'Create a paid Microlink Checkout Session for a `planId` from `microlink_list_plans`.',
      'The signed-in dashboard account is billed. An existing subscription gets an extra key.',
      'Returns `connectUrl`. Give that to the human on the machine running this server; do not open it.',
      'They sign in, and the dashboard calls back to this machine (the same Connect handshake as `microlink buy`).',
      'A free development key is dashboard Sign up at https://dashboard.microlink.io/signup, not this tool.',
      'Then poll `microlink_get_checkout_session` with `sessionId`. When `checkoutUrl` appears, give that to the human to pay; do not open or complete it.',
      'Keep polling until `state` is `ready` (or stop on `expired`).',
      'Reuse the returned `idempotencyKey` when retrying this logical call. `email` is not accepted.',
      'These tools never return the API key secret; the human receives it via welcome email or the dashboard.'
    ].join(' '),
    createCheckoutSessionInputSchema,
    (_client, input) => createCheckoutSession(input),
    { ...INTERACTIVE_ANNOTATIONS, destructiveHint: false }
  )
}
