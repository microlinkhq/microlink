import $ from 'tinyspawn'
import test from 'ava'

const evalScript = (code, flags = []) =>
  $('node', ['--eval', code, ...flags]).then(({ stdout }) => stdout)
evalScript.esm = code => evalScript(code, ['--input-type', 'module'])

const sort = array => array.sort((a, b) => a.localeCompare(b))

test('esm', async t => {
  t.is(
    await evalScript.esm(
      "import google from '@microlink/google'; console.log(typeof google)"
    ),
    'function'
  )

  const methods = sort(
    JSON.parse(
      await evalScript(
        'import("@microlink/google").then(m => console.log(JSON.stringify(Object.keys(m))))'
      )
    )
  )

  t.deepEqual(methods, ['buildPath', 'buildUrl', 'default', 'DOMAIN'])

  t.is(
    await evalScript.esm(
      "import {buildUrl} from '@microlink/google'; console.log(typeof buildUrl)"
    ),
    'function'
  )
})

test('cjs', async t => {
  t.is(
    await evalScript(
      "const google = require('@microlink/google'); console.log(typeof google)"
    ),
    'function'
  )
  t.is(
    await evalScript(
      "const google = require('@microlink/google'); console.log(typeof google.default)"
    ),
    'undefined'
  )

  const methods = sort(
    JSON.parse(
      await evalScript(
        "const google = require('@microlink/google'); console.log(JSON.stringify(Object.keys(google)))"
      )
    )
  )

  t.deepEqual(methods, ['buildPath', 'buildUrl', 'DOMAIN'])

  t.is(
    await evalScript(
      "const {buildUrl} = require('@microlink/google'); console.log(typeof buildUrl)"
    ),
    'function'
  )
})
