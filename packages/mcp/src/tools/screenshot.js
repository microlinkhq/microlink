import { screenshotInputSchema } from '../schemas.js'
import { register } from './register.js'

export function screenshot (server) {
  register(
    server,
    'microlink_screenshot',
    [
      'Capture a screenshot of any public URL via Microlink and return a permanent CDN asset URL.',
      'The screenshot URL is in `data.screenshot.url`.',
      'Pass `screenshot: true` for defaults or `screenshot: { ... }` for options; `screenshot: {}` is treated as `true`.',
      'Use `screenshot.fullPage` to capture the entire scrollable page.',
      'Use `screenshot.element` (CSS selector) to capture a specific DOM element.',
      'Use `screenshot.type` to choose output format: "jpeg" (default "png").',
      'Use `screenshot.omitBackground` to remove the white background (useful with transparent PNGs).',
      'Use `screenshot.overlay` to add a browser chrome overlay with `browser` ("light"|"dark") and `background` (CSS color or gradient).',
      'Use `screenshot.codeScheme` to set the syntax-highlighting theme for code pages (e.g. "dracula", "atom-dark").',
      'Combine with `device`, `viewport`, `click`, `scroll`, `styles`, `scripts`, `modules`, `waitForSelector`, `waitForTimeout`, `waitUntil`, `colorScheme`, and `mediaType` for full browser control.'
    ].join(' '),
    screenshotInputSchema,
    { screenshot: true, meta: false }
  )
}
