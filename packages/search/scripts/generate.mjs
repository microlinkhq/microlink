import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import createGoogleClient from '../src/main.mjs'

const products = [
  { type: 'autocomplete', query: 'javascript debounce' },
  { type: 'images', query: 'kubernetes architecture diagram' },
  { type: 'maps', query: 'software engineering conferences madrid' },
  { type: 'news', query: 'openai api developers' },
  { type: 'patents', query: 'compiler optimization patent' },
  { type: 'places', query: 'coworking space barcelona' },
  { type: 'scholar', query: 'attention is all you need transformer' },
  { type: 'search', query: 'site:developer.mozilla.org fetch api' },
  { type: 'shopping', query: 'ergonomic mechanical keyboard' },
  { type: 'videos', query: 'node.js streams tutorial' }
]

const generatorPath = fileURLToPath(import.meta.url)
const scriptsDir = dirname(generatorPath)
const examplesDir = join(scriptsDir, '..', 'examples')

const ensureApiKey = () => {
  if (!process.env.MICROLINK_API_KEY) {
    throw new Error('Missing MICROLINK_API_KEY environment variable.')
  }
}

const toSnapshot = page => JSON.parse(JSON.stringify(page))

const toOptions = ({ type, options = {} }) => ({ type, ...options })

const formatValue = value => {
  if (typeof value === 'string') return `'${value}'`
  return String(value)
}

const formatObject = object => {
  const entries = Object.entries(object)
  if (entries.length === 0) return '{}'

  return `{
${entries
  .map(([key, value]) => `    ${key}: ${formatValue(value)}`)
  .join(',\n')}
  }`
}

const buildExampleSource = product => {
  const requestOptions = formatObject(toOptions(product))

  return `'use strict'

import createGoogleClient from '@microlink/google'

const google = createGoogleClient({
  apiKey: process.env.MICROLINK_API_KEY
})

const page = await google('${product.query}', ${requestOptions})

console.log(page)`
}

const writeExampleFiles = async (product, page) => {
  const codePath = join(examplesDir, `${product.type}.mjs`)
  const jsonPath = join(examplesDir, `${product.type}.json`)

  await writeFile(codePath, buildExampleSource(product))
  await writeFile(jsonPath, `${JSON.stringify(toSnapshot(page), null, 2)}\n`)

  return { codePath, jsonPath }
}

const main = async () => {
  ensureApiKey()

  await mkdir(examplesDir, { recursive: true })

  const google = createGoogleClient({
    apiKey: process.env.MICROLINK_API_KEY,
    ...(process.env.MICROLINK_API_ENDPOINT && {
      endpoint: process.env.MICROLINK_API_ENDPOINT
    })
  })

  for (const product of products) {
    const page = await google(product.query, toOptions(product))
    const { codePath, jsonPath } = await writeExampleFiles(product, page)

    console.log(`Generated ${codePath}`)
    console.log(`Generated ${jsonPath}`)
  }
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
