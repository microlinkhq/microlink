import { pdfInputSchema } from '../schemas.js'
import { capabilityMethod, register } from './register.js'

export function pdf (server) {
  register(
    server,
    'microlink_pdf',
    'Generate a PDF of a public URL. Returns a CDN asset (`url`, `type`, `size`).',
    pdfInputSchema,
    capabilityMethod('pdf', 'pdf')
  )
}
