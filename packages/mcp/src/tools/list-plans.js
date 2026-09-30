import { listPlans } from '../dashboard-client.js'
import { listPlansInputSchema } from '../schemas.js'
import { register } from './register.js'

export function plans (server) {
  register(
    server,
    'microlink_list_plans',
    'List the Microlink plans available to a new customer. Share these with the human before they pay. `microlink_create_checkout_session` opens guest Sign up for the starter creatable plan.',
    listPlansInputSchema,
    () => listPlans()
  )
}
