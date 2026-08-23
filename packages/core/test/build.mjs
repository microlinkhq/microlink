import { readFile, access, constants } from 'fs/promises'
import { fileURLToPath } from 'url'
import $ from 'tinyspawn'
import test from 'ava'
import path from 'path'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

const pkg = JSON.parse(
  await readFile(path.join(root, 'package.json'), 'utf8')
)

const evalScript = (code, flags = []) =>
  $('node', ['--eval', code, ...flags]).then(({ stdout }) => stdout)

evalScript.esm = code => evalScript(code, ['--input-type', 'module'])

const PRODUCTS = [
  'audio',
  'audios',
  'emails',
  'embed',
  'extract',
  'function',
  'html',
  'images',
  'lighthouse',
  'links',
  'logo',
  'markdown',
  'metadata',
  'pdf',
  'run',
  'screenshot',
  'search',
  'technologies',
  'text',
  'video',
  'videos'
]

test('cjs entry exposes the factory and every product', async t => {
  t.is(
    await evalScript(
      "const create = require('./src/index.js'); console.log(typeof create, typeof create.MicrolinkError)"
    ),
    'function function'
  )
  const methods = JSON.parse(
    await evalScript(
      "console.log(JSON.stringify(Object.keys(require('./src/index.js')()).sort()))"
    )
  )
  t.deepEqual(methods, PRODUCTS)
})

test('esm entry exposes the same client', async t => {
  t.is(
    await evalScript.esm(
      "import create, { MicrolinkError } from './src/main.mjs'; console.log(typeof create, typeof MicrolinkError)"
    ),
    'function function'
  )
  const methods = JSON.parse(
    await evalScript.esm(
      "import create from './src/main.mjs'; console.log(JSON.stringify(Object.keys(create()).sort()))"
    )
  )
  t.deepEqual(methods, PRODUCTS)
})

test('every bin entry is an executable file with a node shebang', async t => {
  const { bin } = pkg
  for (const target of new Set(Object.values(bin))) {
    const file = path.join(root, target)
    await t.notThrowsAsync(() => access(file, constants.X_OK))
    const source = await readFile(file, 'utf8')
    t.true(source.startsWith('#!/usr/bin/env node'))
  }
})

test('npx <package name> resolves to the cli', t => {
  t.is(pkg.bin[pkg.name], pkg.bin.microlink)
})

test('published files include every bin entry', t => {
  t.true(
    Object.values(pkg.bin).every(target =>
      pkg.files.some(entry => target.startsWith(entry))
    )
  )
})
