import { screenshotInputSchema } from '../schemas.js'
import { capabilityMethod, register } from './register.js'

export function screenshot (server) {
  register(
    server,
    'microlink_screenshot',
    'Capture a screenshot of a public URL. Returns a CDN asset (`url`, `type`, `width`, `height`, `size`).',
    screenshotInputSchema,
    capabilityMethod('screenshot', 'screenshot')
  )
}
