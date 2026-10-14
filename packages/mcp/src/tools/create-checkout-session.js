import { createCheckoutSession } from '../dashboard-client.js'
import { createCheckoutSessionInputSchema } from '../schemas.js'
import { INTERACTIVE_ANNOTATIONS, register } from './register.js'

export function checkoutCreate (server) {
  register(
    server,
    'microlink_create_checkout_session',
    [
      'Create a Microlink Sign up Checkout Session (the same guest flow as the dashboard Sign up button).',
      'Stripe Checkout collects the email. The session is the starter creatable plan; it does not add an extra key to an existing subscription.',
      'Give `checkoutUrl` to the human and wait for them to complete payment; never open or complete it on their behalf.',
      'Then poll `microlink_get_checkout_session` with `sessionId` until `state` is `ready` (or stop on `expired`).',
      'These tools never return the API key secret; the human receives it via welcome email or the dashboard.'
    ].join(' '),
    createCheckoutSessionInputSchema,
    () => createCheckoutSession(),
    { ...INTERACTIVE_ANNOTATIONS, destructiveHint: false }
  )
}
