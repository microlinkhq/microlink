import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const cli = require('./run.js')

export default cli
export const run = cli.run
export const helpText = cli.helpText
