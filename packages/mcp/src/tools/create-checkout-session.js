import { createCheckoutSession } from '../dashboard-client.js'
import { createCheckoutSessionInputSchema } from '../schemas.js'
import { INTERACTIVE_ANNOTATIONS, register } from './register.js'

export function checkoutCreate (server) {
  register(
    server,
    'microlink_create_checkout_session',
    [
      'Create a Microlink subscription Checkout Session for a plan returned by `microlink_list_plans`.',
      'Generate an idempotency UUID automatically, or accept `idempotencyKey` so a retry of the same logical call cannot create a duplicate session during Stripe’s 24-hour deduplication window.',
      'Give `checkoutUrl` to the human and wait for them to complete payment; never open or complete it on their behalf.',
      'Then poll `microlink_get_checkout_session` with `sessionId` until `state` is `ready` (or stop on `expired`).',
      '`ready` means the account is provisioned and includes `keyId` (a non-secret key handle, not the API secret).',
      'These tools never return the API key secret; the human receives it via welcome email or the dashboard.'
    ].join(' '),
    createCheckoutSessionInputSchema,
    (_client, input) => createCheckoutSession(input),
    { ...INTERACTIVE_ANNOTATIONS, destructiveHint: false }
  )
}
