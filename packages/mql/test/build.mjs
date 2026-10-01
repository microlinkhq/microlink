import { createRequire } from 'module'
import $ from 'tinyspawn'
import test from 'ava'

const pkg = createRequire(import.meta.url)('../package.json')

const evalScript = (code, flags = []) => $('node', ['--eval', code, ...flags]).then(({ stdout }) => stdout)
evalScript.esm = code => evalScript(code, ['--input-type', 'module'])

const sort = array => array.sort((a, b) => a.localeCompare(b))

test('esm', async t => {
  // eslint-disable-next-line no-template-curly-in-string
  t.is((await evalScript.esm("import mql from '@microlink/mql'; console.log(`mql v${mql.version}`)")), `mql v${pkg.version}`)

  const methods = sort(JSON.parse((await evalScript('import("@microlink/mql").then(mql => console.log(JSON.stringify(Object.keys(mql))))'))))

  t.deepEqual(methods,
    [
      'arrayBuffer',
      'buffer',
      'default',
      'extend',
      'fetchFromApi',
      'getApiUrl',
      'mapRules',
      'MicrolinkError',
      'stream',
      'version'
    ]
  )

  t.is((await evalScript.esm("import {getApiUrl} from '@microlink/mql'; console.log(typeof getApiUrl)")), 'function')
})

test('cjs loads and fetches without require(esm) support', async t => {
  const code = `
    const http = require('http')
    const mql = require('@microlink/mql')
    const server = http.createServer((req, res) => {
      res.setHeader('content-type', 'application/json')
      res.end(JSON.stringify({ status: 'success', data: { title: 'ok' } }))
    }).listen(0, async () => {
      const endpoint = 'http://localhost:' + server.address().port
      const { data } = await mql('https://example.com', { endpoint })
      console.log(data.title)
      server.close()
    })
  `
  const { stdout } = await $('node', ['--no-experimental-require-module', '--eval', code])
  t.is(stdout, 'ok')
})

test('cjs', async t => {
  t.is((await evalScript("const mql = require('@microlink/mql'); console.log(typeof mql)")), 'function')
  t.is((await evalScript("const mql = require('@microlink/mql'); console.log(typeof mql.default)")), 'undefined')

  const methods = sort(JSON.parse((await evalScript("const mql = require('@microlink/mql'); console.log(JSON.stringify(Object.keys(mql)))"))))

  t.deepEqual(methods,
    [
      'arrayBuffer',
      'buffer',
      'extend',
      'fetchFromApi',
      'getApiUrl',
      'mapRules',
      'MicrolinkError',
      'stream',
      'version'
    ]
  )

  t.is((await evalScript("const {getApiUrl} = require('@microlink/mql'); console.log(typeof getApiUrl)")), 'function')
})
