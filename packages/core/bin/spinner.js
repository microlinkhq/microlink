'use strict'

const SHOW_CURSOR = '\u001b[?25h'
const HIDE_CURSOR = '\u001b[?25l'
const CLEAR_LINE = '\r\u001b[K'
const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

module.exports = ({ stderr, prettyMs, onInterrupt, onAbort }) => {
  const now = Date.now()
  let i = 0
  let timer
  let offInterrupt
  const draw = () => {
    stderr.write(
      `${CLEAR_LINE}${FRAMES[i++ % FRAMES.length]} ${prettyMs(
        Date.now() - now
      )}`
    )
  }
  const stop = () => {
    clearInterval(timer)
    offInterrupt?.()
    offInterrupt = undefined
    stderr.write(CLEAR_LINE + SHOW_CURSOR)
  }
  return {
    start () {
      stderr.write(HIDE_CURSOR)
      draw()
      offInterrupt = onInterrupt?.(() => {
        stop()
        onAbort?.()
      })
      timer = setInterval(draw, 50)
    },
    stop
  }
}
