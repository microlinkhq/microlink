import { cp, mkdir, mkdtemp, rm, symlink, writeFile } from 'fs/promises'
import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import { tmpdir } from 'os'
import $ from 'tinyspawn'
import test from 'ava'
import path from 'path'

const require = createRequire(import.meta.url)
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const tsc = path.join(root, 'node_modules', '.bin', 'tsc')

const copyTypes = async (nodeModules, dir) => {
  const { name, types } = require(path.join(dir, 'package.json'))
  const dest = path.join(nodeModules, name)
  await mkdir(path.dirname(path.join(dest, types)), { recursive: true })
  await cp(path.join(dir, 'package.json'), path.join(dest, 'package.json'))
  await cp(path.join(dir, types), path.join(dest, types))
}

const compile = async (t, { puppeteer, consumer }) => {
  const cwd = await mkdtemp(path.join(tmpdir(), 'microlink-function-types-'))
  t.teardown(() => rm(cwd, { recursive: true, force: true }))
  const nodeModules = path.join(cwd, 'node_modules')
  await copyTypes(nodeModules, root)
  await copyTypes(nodeModules, path.resolve(path.dirname(require.resolve('@microlink/mql')), '..'))
  if (puppeteer) {
    await symlink(path.dirname(require.resolve('puppeteer-core/package.json')), path.join(nodeModules, 'puppeteer-core'))
  }
  await writeFile(path.join(cwd, 'index.cts'), consumer)
  await writeFile(path.join(cwd, 'tsconfig.json'), JSON.stringify({
    compilerOptions: { strict: true, noEmit: true, skipLibCheck: false, module: 'nodenext', target: 'es2022', lib: ['es2022', 'dom'], types: [] },
    files: ['index.cts']
  }))
  return $(tsc, ['-p', cwd], { cwd }).then(() => '', error => error.stdout)
}

test('types compile without puppeteer-core installed', async t => {
  const consumer = `
import microlinkFunction = require('@microlink/function')
microlinkFunction(async ({ page, response }) => [await page.title(), response.status()])
`
  t.is(await compile(t, { puppeteer: false, consumer }), '')
})

test('types use the puppeteer-core Page when it is installed', async t => {
  const consumer = `
import microlinkFunction = require('@microlink/function')
import type { HTTPResponse, Page } from 'puppeteer-core'
microlinkFunction(async ({ page, response }) => {
  const puppeteerPage: Page = page
  const puppeteerResponse: HTTPResponse = response
  // @ts-expect-error a puppeteer Page has no such method
  page.notAPageMethod()
  // @ts-expect-error a puppeteer HTTPResponse has no such method
  response.notAResponseMethod()
  return [await puppeteerPage.title(), puppeteerResponse.status()]
})
`
  t.is(await compile(t, { puppeteer: true, consumer }), '')
})
