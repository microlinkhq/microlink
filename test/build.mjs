import $ from 'tinyspawn'
import test from 'ava'

const evalScript = (code, flags = []) =>
  $('node', ['--eval', code, ...flags]).then(({ stdout }) => stdout)

evalScript.esm = code => evalScript(code, ['--input-type', 'module'])

const PRODUCTS = [
  'audio',
  'audios',
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
