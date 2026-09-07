'use strict'

const mriModule = require('mri')
const mri = typeof mriModule === 'function' ? mriModule : mriModule.default

module.exports = argvInput =>
  mri(argvInput, {
    alias: { H: 'header' },
    boolean: ['trace', 'trace-full', 'help', 'html', 'markdown'],
    string: ['header', 'api-key', 'data', 'file', 'endpoint']
  })
