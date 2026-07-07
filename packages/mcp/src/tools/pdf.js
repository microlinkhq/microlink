import { pdfInputSchema } from '../schemas.js'
import { register } from './register.js'

export function pdf (server) {
  register(
    server,
    'microlink_pdf',
    [
      'Generate a PDF of any public URL via Microlink and return a permanent CDN asset URL.',
      'The PDF URL is in `data.pdf.url`.',
      'Pass `pdf: true` for defaults or `pdf: { ... }` for options; `pdf: {}` is treated as `true`.',
      'Use `pdf.format` to set paper size: "A4" (default), "Letter", "Legal", "Tabloid", "Ledger", "A0"–"A6".',
      'Use `pdf.landscape` to switch to landscape orientation.',
      'Use `pdf.margin` to set page margins as a string ("0.35cm") or object with top/bottom/left/right.',
      'Use `pdf.scale` to scale the page (0.1–2.0).',
      'Use `pdf.pageRanges` to select specific pages (e.g. "1-5").',
      'Use `pdf.width` and `pdf.height` for custom dimensions (overrides format).',
      'Combine with `styles`, `scripts`, `modules`, `mediaType`, `waitForSelector`, and `waitUntil` for full control.'
    ].join(' '),
    pdfInputSchema,
    { pdf: true, meta: false }
  )
}
