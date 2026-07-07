import { audio } from './audio.js'
import { audios } from './audios.js'
import { emails } from './emails.js'
import { embed } from './embed.js'
import { extract } from './extract.js'
import { html } from './html.js'
import { images } from './images.js'
import { lighthouse } from './lighthouse.js'
import { links } from './links.js'
import { logo } from './logo.js'
import { markdown } from './markdown.js'
import { metadata } from './metadata.js'
import { pdf } from './pdf.js'
import { screenshot } from './screenshot.js'
import { technologies } from './technologies.js'
import { text } from './text.js'
import { video } from './video.js'
import { videos } from './videos.js'

export function tools (server) {
  metadata(server)
  logo(server)
  markdown(server)
  html(server)
  text(server)
  screenshot(server)
  pdf(server)
  embed(server)
  video(server)
  audio(server)
  links(server)
  images(server)
  videos(server)
  audios(server)
  emails(server)
  technologies(server)
  lighthouse(server)
  extract(server)
}
