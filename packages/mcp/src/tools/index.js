import { audio } from './audio.js'
import { extract } from './extract.js'
import { insights } from './insights.js'
import { markdown } from './markdown.js'
import { meta } from './meta.js'
import { palette } from './palette.js'
import { pdf } from './pdf.js'
import { screenshot } from './screenshot.js'
import { text } from './text.js'
import { video } from './video.js'

export function tools (server) {
  extract(server)
  screenshot(server)
  pdf(server)
  video(server)
  audio(server)
  insights(server)
  meta(server)
  palette(server)
  markdown(server)
  text(server)
}
