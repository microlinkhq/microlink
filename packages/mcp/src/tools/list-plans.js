import { listPlans } from '../dashboard-client.js'
import { listPlansInputSchema } from '../schemas.js'
import { register } from './register.js'

export function plans (server) {
  register(
    server,
    'microlink_list_plans',
    'List the Microlink plans available to a new customer. Use an `id` from this result as `planId` in `microlink_create_checkout_session`.',
    listPlansInputSchema,
    () => listPlans()
  )
}
