import { paletteInputSchema } from '../schemas.js'
import { register } from './register.js'

export function palette (server) {
  register(
    server,
    'microlink_palette',
    [
      'Extract a color palette from images detected on any public URL via Microlink.',
      'For each image, returns: `palette` (hex colors from most to least dominant), `background_color` (optimal WCAG-contrast background), `color` (best overlay color for the background), and `alternative_color` (secondary overlay color).',
      'Color data is nested under each image field in the response (e.g. `data.image.palette`, `data.image.background_color`).',
      'Useful for generating design tokens, theming, or accessibility checks from real page images.'
    ].join(' '),
    paletteInputSchema,
    { palette: true, meta: true }
  )
}
