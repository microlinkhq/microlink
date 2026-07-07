import { emailsInputSchema } from '../schemas.js'
import { register } from './register.js'

export function emails (server) {
  register(
    server,
    'microlink_emails',
    [
      'Extract every email address present on any public URL via Microlink.',
      'Detects addresses from `mailto:` links and plain text alike; returns a deduped array under `data.emails`.',
      'Mirrors the `microlink.emails(url)` library method.'
    ].join(' '),
    emailsInputSchema,
    {
      data: { emails: { selector: 'html', attr: 'html', type: 'email' } },
      meta: false
    }
  )
}
