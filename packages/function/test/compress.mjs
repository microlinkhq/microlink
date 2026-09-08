import { brotliDecompress, gunzip } from 'zlib'
import { createRequire } from 'module'
import { promisify } from 'util'
import test from 'ava'

const require = createRequire(import.meta.url)
const fn = require('@microlink/function')

const decompress = promisify(brotliDecompress)
const unzip = promisify(gunzip)
const code = '({ page }) => page.title()'

test('compress is exported', t => {
  t.is(typeof fn.compress, 'function')
})

test('selects brotli when CompressionStream supports it', async t => {
  const compressed = await fn.compress(code)
  t.true(compressed.startsWith('br#'))
})

test('brotli roundtrip produces original code', async t => {
  const compressed = await fn.compress(code)
  const payload = compressed.slice(3)
  const decompressed = (
    await decompress(Buffer.from(payload, 'base64url'))
  ).toString()
  t.is(decompressed, code)
})

test('falls back to gzip when brotli is unavailable', async t => {
  const { execFileSync } = require('child_process')
  const result = execFileSync(
    process.execPath,
    [
      '-e',
      `
    const OriginalCS = globalThis.CompressionStream
    globalThis.CompressionStream = class {
      constructor (format) {
        if (format === 'brotli') throw new TypeError('unsupported')
        return new OriginalCS(format)
      }
    }
    const fn = require(${JSON.stringify(require.resolve('@microlink/function'))})
    fn.compress(${JSON.stringify(code)}).then(r => process.stdout.write(r))
  `
    ],
    { encoding: 'utf8' }
  )
  t.true(result.startsWith('gz#'))
  const decompressed = (
    await unzip(Buffer.from(result.slice(3), 'base64url'))
  ).toString()
  t.is(decompressed, code)
})
