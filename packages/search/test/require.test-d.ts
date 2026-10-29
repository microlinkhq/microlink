import { expectType } from 'tsd'
import createGoogleClient = require('../src/index.js')
import { DOMAIN, buildPath, buildUrl } from '../src/index.js'

type HasDefault = 'default' extends keyof typeof createGoogleClient ? true : false
expectType<false>(false as HasDefault)

expectType<typeof createGoogleClient.DOMAIN>(DOMAIN)
expectType<typeof createGoogleClient.buildPath>(buildPath)
expectType<typeof createGoogleClient.buildUrl>(buildUrl)
