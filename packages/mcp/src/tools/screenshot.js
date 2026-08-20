import { screenshotInputSchema } from '../schemas.js'
import { capabilityMethod, register } from './register.js'

export function screenshot (server) {
  register(
    server,
    'microlink_screenshot',
    [
      'Capture a screenshot of any public URL via Microlink and return the asset object (`url`, `type`, `width`, `height`, `size`, ...) with a permanent CDN URL.',
      'Pass `screenshot: true` for defaults or `screenshot: { ... }` for options; `screenshot: {}` is treated as `true`.',
      'Use `screenshot.fullPage` to capture the whole scrollable page.',
      'Use `screenshot.animated` to capture an animated screenshot (GIF/MP4) instead of a still image.',
      'Use `screenshot.element` (CSS selector) to capture a specific element, `screenshot.type` for format ("jpeg", default "png"), `screenshot.omitBackground` for transparency, `screenshot.overlay` for browser chrome, `screenshot.palette` to also extract dominant colors, or `screenshot.codeScheme` to theme code pages.',
      'Prefer `actions` (ordered browser steps: inject, click, wait, scroll, fill, screenshot, …) with semantic locators (`role`+`name`, `label`, `text`, `testId`) or CSS `selector` — e.g. `actions: [{ type: "click", role: "button", name: "Accept" }, { type: "wait", timeout: "1s" }]`.',
      'Legacy `click`, `scroll`, `styles`, `scripts`, `modules`, `waitForSelector`, and `waitForTimeout` still work; also `device`, `viewport`, `waitUntil`, `colorScheme`, and `mediaType`.',
      'Mirrors the `microlink.screenshot(url, options)` library method.'
    ].join(' '),
    screenshotInputSchema,
    capabilityMethod('screenshot', 'screenshot')
  )
}
