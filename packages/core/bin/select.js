'use strict'

const readline = require('readline')
const { gray, white, styleText } = require('./style')

const HIDE = '\u001b[?25l'
const SHOW = '\u001b[?25h'
const UP_N = n => `\u001b[${n}A`

const label = (choice, current) => {
  const mark = current && choice.value === current ? gray(' (current)') : ''
  return `${choice.name} ${gray(`(${choice.hint})`)}${mark}`
}

const numbered = ({ message, choices, current }) =>
  new Promise((resolve, reject) => {
    for (const [i, choice] of choices.entries()) {
      process.stderr.write(`  ${i + 1}) ${label(choice, current)}\n`)
    }
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stderr
    })
    rl.question(`${message} `, answer => {
      rl.close()
      const choice = choices[Number.parseInt(answer, 10) - 1]
      if (!choice) reject(new Error('Invalid selection'))
      else resolve(choice)
    })
  })

const arrows = ({ message, choices, current }) => {
  let index = Math.max(
    0,
    choices.findIndex(choice => choice.value === current)
  )
  const lines = choices.length + 1

  const draw = first => {
    if (!first) process.stderr.write(UP_N(lines))
    process.stderr.write(`${styleText('cyan', '?')} ${white(message)}\n`)
    for (const [i, choice] of choices.entries()) {
      const active = i === index
      const prefix = active ? styleText('cyan', '❯') : ' '
      const text = active
        ? styleText('cyan', label(choice, current))
        : label(choice, current)
      process.stderr.write(`\u001b[2K${prefix} ${text}\n`)
    }
  }

  return new Promise((resolve, reject) => {
    readline.emitKeypressEvents(process.stdin)
    process.stdin.setRawMode(true)
    process.stderr.write(HIDE)
    draw(true)

    const cleanup = () => {
      process.stdin.setRawMode(false)
      process.stdin.off('keypress', onKey)
      process.stderr.write(SHOW)
    }

    const onKey = (_str, key) => {
      if (key.name === 'up') {
        index = (index - 1 + choices.length) % choices.length
        draw()
        return
      }
      if (key.name === 'down') {
        index = (index + 1) % choices.length
        draw()
        return
      }
      if (key.name === 'return') {
        cleanup()
        resolve(choices[index])
        return
      }
      if (key.ctrl && key.name === 'c') {
        cleanup()
        reject(Object.assign(new Error('Aborted'), { code: 'ABORT' }))
      }
    }

    process.stdin.on('keypress', onKey)
  })
}

const select = ({ message, choices, current }) => {
  if (choices.length === 1) return Promise.resolve(choices[0])
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    return numbered({ message, choices, current })
  }
  return arrows({ message, choices, current })
}

module.exports = select
