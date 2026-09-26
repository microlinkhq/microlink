'use strict'

const fs = require('fs')
const os = require('os')
const path = require('path')
const { green, gray, red } = require('./style')

const SKILL_URL =
  'https://raw.githubusercontent.com/microlinkhq/skills/master/microlink/SKILL.md'
const SKILL_NAME = 'microlink'
const MARKER = '.managed-by-microlink'

// Codex and Cursor read ~/.agents/skills. Claude Code, OpenCode, and
// Copilot keep their own skills directory, so those get a link — the same
// split `hey setup` uses for Claude vs Codex.
const AGENTS = [
  {
    name: 'Claude Code',
    binary: 'claude',
    dir: ({ home, env }) => env.CLAUDE_CONFIG_DIR || path.join(home, '.claude'),
    skillsDir: dir => path.join(dir, 'skills')
  },
  {
    name: 'Codex',
    binary: 'codex',
    dir: ({ home, env }) => env.CODEX_HOME || path.join(home, '.codex')
  },
  {
    name: 'Cursor',
    binary: 'cursor',
    dir: ({ home }) => path.join(home, '.cursor')
  },
  {
    name: 'OpenCode',
    dir: ({ home, env }) =>
      path.join(env.XDG_CONFIG_HOME || path.join(home, '.config'), 'opencode'),
    skillsDir: dir => path.join(dir, 'skills')
  },
  {
    name: 'GitHub Copilot',
    dir: ({ home }) => path.join(home, '.copilot'),
    skillsDir: dir => path.join(dir, 'skills')
  }
]

const writeLine = (stream, text) => {
  stream.write(`${text}\n`)
}

const isDir = file => {
  try {
    return fs.statSync(file).isDirectory()
  } catch {
    return false
  }
}

const which = (name, env) => {
  const dirs = (env.PATH || '').split(path.delimiter).filter(Boolean)
  const exts =
    process.platform === 'win32'
      ? (env.PATHEXT || '.EXE;.CMD;.BAT;.COM').split(';')
      : ['']
  for (const dir of dirs) {
    for (const ext of exts) {
      const candidate = path.join(dir, name + ext)
      try {
        if (fs.statSync(candidate).isFile()) return candidate
      } catch {}
    }
  }
  return ''
}

const display = (home, file) =>
  file.startsWith(home) ? `~${file.slice(home.length)}` : file

const writeRegular = (file, data) => {
  try {
    if (!fs.lstatSync(file).isFile()) {
      throw new Error(`${file} is not a regular file`)
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
  fs.writeFileSync(file, data)
}

const owned = dir => {
  try {
    return fs.lstatSync(path.join(dir, MARKER)).isFile()
  } catch {
    return false
  }
}

// A directory microlink did not write is left alone. An empty one, or one
// that already carries the marker, is claimed.
const claim = dir => {
  let info
  try {
    info = fs.lstatSync(dir)
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
    fs.mkdirSync(dir, { recursive: true })
    writeRegular(
      path.join(dir, MARKER),
      'This skill is managed by microlink. Manual edits will be overwritten on upgrade.\n'
    )
    return
  }
  if (info.isSymbolicLink() || !info.isDirectory()) {
    throw new Error(
      `${dir} exists but was not written by microlink. Move it aside, then run \`microlink setup\` again.`
    )
  }
  if (owned(dir)) return
  const entries = fs.readdirSync(dir)
  if (entries.length > 0) {
    throw new Error(
      `${dir} exists but was not written by microlink. Move it aside, then run \`microlink setup\` again.`
    )
  }
  writeRegular(
    path.join(dir, MARKER),
    'This skill is managed by microlink. Manual edits will be overwritten on upgrade.\n'
  )
}

const installSkill = (home, body) => {
  const dir = path.join(home, '.agents', 'skills', SKILL_NAME)
  claim(dir)
  writeRegular(path.join(dir, 'SKILL.md'), body)
  return dir
}

const linkSkill = (skillsDir, canonicalDir) => {
  if (path.resolve(skillsDir) === path.dirname(path.resolve(canonicalDir))) {
    return
  }
  fs.mkdirSync(skillsDir, { recursive: true })
  const link = path.join(skillsDir, SKILL_NAME)
  const target =
    path.relative(fs.realpathSync(skillsDir), fs.realpathSync(canonicalDir)) ||
    canonicalDir
  let info
  try {
    info = fs.lstatSync(link)
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
    try {
      fs.symlinkSync(target, link, 'dir')
    } catch {
      claim(link)
      for (const name of ['SKILL.md', MARKER]) {
        const from = path.join(canonicalDir, name)
        if (fs.existsSync(from)) {
          writeRegular(path.join(link, name), fs.readFileSync(from))
        }
      }
    }
    return
  }
  if (info.isSymbolicLink()) {
    if (fs.readlinkSync(link) === target) return
    throw new Error(
      `${link} points somewhere else. Move it aside, then run \`microlink setup\` again.`
    )
  }
  if (info.isDirectory() && owned(link)) {
    for (const name of ['SKILL.md', MARKER]) {
      const from = path.join(canonicalDir, name)
      if (fs.existsSync(from)) {
        writeRegular(path.join(link, name), fs.readFileSync(from))
      }
    }
    return
  }
  throw new Error(
    `${link} exists but was not written by microlink. Move it aside, then run \`microlink setup\` again.`
  )
}

const detect = ({ home, env, find }) =>
  AGENTS.filter(agent => {
    const dir = agent.dir({ home, env })
    return isDir(dir) || (agent.binary && find(agent.binary))
  })

const fetchSkill = async fetchFn => {
  const res = await fetchFn(SKILL_URL, { signal: AbortSignal.timeout(10_000) })
  if (!res.ok) {
    throw new Error(`Failed to fetch the Microlink skill (${res.status})`)
  }
  const body = await res.text()
  if (!body.startsWith('---\nname: microlink\n')) {
    throw new Error('The downloaded file is not the Microlink skill')
  }
  return body
}

const finish = stderr => {
  writeLine(stderr, '')
  writeLine(
    stderr,
    gray('Start by typing ') + '/microlink' + gray(' to use it.')
  )
}

const setup = async ({
  stderr,
  env = {},
  home = os.homedir(),
  fetch: fetchFn = fetch,
  which: find = name => which(name, env)
} = {}) => {
  writeLine(stderr, '')
  writeLine(stderr, gray("Let's get you set up. It'll only take a moment"))
  writeLine(stderr, '')

  const agents = detect({ home, env, find })
  const body = await fetchSkill(fetchFn)
  const dir = installSkill(home, body)
  const issues = []

  if (agents.length === 0) {
    writeLine(stderr, 'No coding agents detected.')
    writeLine(
      stderr,
      `Installed the Microlink skill to ${display(
        home,
        path.join(dir, 'SKILL.md')
      )}`
    )
    finish(stderr)
    return
  }

  for (const agent of agents) {
    try {
      if (agent.skillsDir) {
        linkSkill(agent.skillsDir(agent.dir({ home, env })), dir)
      }
      writeLine(stderr, `${green('✓')} ${agent.name} ${gray('connected')}`)
    } catch (error) {
      issues.push(error.message)
      writeLine(stderr, red(`✗ ${agent.name}`))
      writeLine(stderr, gray(error.message))
    }
  }

  if (issues.length > 0) {
    throw new Error('Setup incomplete')
  }
  finish(stderr)
}

module.exports = setup
module.exports.SKILL_URL = SKILL_URL
