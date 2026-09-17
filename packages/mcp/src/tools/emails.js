import { emailsInputSchema } from '../schemas.js'
import { register, urlMethod } from './register.js'

export function emails (server) {
  register(
    server,
    'microlink_emails',
    'Every email address on the page.',
    emailsInputSchema,
    urlMethod('emails')
  )
}
