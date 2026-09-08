'use strict'

const mql = require('@microlink/mql')

const format = (() => {
  try {
    // eslint-disable-next-line no-new
    new CompressionStream('brotli')
    return 'brotli'
  } catch {
    return 'gzip'
  }
})()

const toBase64url = bytes => {
  if (typeof Buffer === 'function') { return Buffer.from(bytes).toString('base64url') }
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const toCompress = async code => {
  const stream = new Blob([code.toString()])
    .stream()
    .pipeThrough(new CompressionStream(format))
  const bytes = new Uint8Array(await new Response(stream).arrayBuffer())
  const alias = format === 'brotli' ? 'br' : 'gz'
  return `${alias}#${toBase64url(bytes)}`
}

const fn = (code, mqlOpts, gotOpts) => {
  const compressed = toCompress(code)

  return async (url, opts) => {
    const { data } = await mql(
      url,
      {
        function: await compressed,
        meta: false,
        ...mqlOpts,
        ...opts
      },
      gotOpts
    )

    return data.function
  }
}

fn.compress = toCompress
fn.mql = mql
fn.version = require('../package.json').version

module.exports = fn
