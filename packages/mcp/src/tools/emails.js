import { emailsInputSchema } from '../schemas.js'
import { register, urlMethod } from './register.js'

export function emails (server) {
  register(
    server,
    'microlink_emails',
    [
      'Collect every email address present on any public URL via Microlink.',
      'Detects addresses from `mailto:` links and plain text alike; returns a deduped array.',
      'Mirrors the `microlink.emails(url)` library method.'
    ].join(' '),
    emailsInputSchema,
    urlMethod('emails')
  )
}
