import { pdfInputSchema } from '../schemas.js'
import { capabilityMethod, register } from './register.js'

export function pdf (server) {
  register(
    server,
    'microlink_pdf',
    [
      'Generate a PDF of any public URL via Microlink and return the asset object (`url`, `type`, `size`, ...) with a permanent CDN URL.',
      'Pass `pdf: true` for defaults or `pdf: { ... }` for options; `pdf: {}` is treated as `true`.',
      'Use `pdf.format` ("A4" default, "Letter", "Legal", ...), `pdf.landscape`, `pdf.margin` (string or top/bottom/left/right object), `pdf.scale` (0.1-2.0), `pdf.pageRanges` ("1-5"), or `pdf.width`/`pdf.height`.',
      'Prefer `actions` (ordered browser steps: inject, click, wait, scroll, fill, pdf, …) with semantic locators or CSS `selector`.',
      'Legacy `styles`, `scripts`, `modules`, `waitForSelector`, and `waitUntil` still work; also `mediaType`.',
      'Mirrors the `microlink.pdf(url, options)` library method.'
    ].join(' '),
    pdfInputSchema,
    capabilityMethod('pdf', 'pdf')
  )
}
