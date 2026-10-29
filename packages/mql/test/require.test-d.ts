import { expectAssignable, expectError, expectType } from 'tsd'
import mql = require('@microlink/mql')
import type {
  ColorScheme,
  HTTPResponseRaw,
  MicrolinkApiOptions,
  MqlError,
  MqlErrorProps,
  MqlOptions,
  MqlPayload,
  MqlResponse,
  MqlResponseData
} from '@microlink/mql'

type HasDefault = 'default' extends keyof typeof mql ? true : false
expectType<false>(false as HasDefault)

const opts: MqlOptions = { apiKey: 'MyApiToken', meta: false }
const apiOptions: MicrolinkApiOptions = { colorScheme: 'dark' satisfies ColorScheme }
const gotOpts = { timeout: false }

async function request (): Promise<void> {
  const response = await mql('https://example.com', opts, gotOpts)
  expectType<MqlResponse>(response)
  expectAssignable<MqlPayload>(response)
  expectType<MqlResponseData>(response.data)
  expectType<HTTPResponseRaw>(await mql('https://example.com', { embed: 'screenshot.url' }))
  expectType<HTTPResponseRaw>(await mql('https://example.com', { stream: 'screenshot' }))
  expectType<MqlResponse>(await mql('https://example.com', { stream: '' }))
  expectType<MqlResponse>(await mql('https://example.com', { embed: '' }))
  expectType<MqlResponse>(await mql('https://example.com', { stream: '', embed: '' }))
  expectType<HTTPResponseRaw>(await mql('https://example.com', { stream: 'screenshot', embed: '' }))
  expectType<HTTPResponseRaw>(await mql('https://example.com', { stream: '', embed: 'screenshot.url' }))

  expectType<HTTPResponseRaw>(await mql.arrayBuffer('https://example.com', apiOptions, gotOpts))
  expectType<HTTPResponseRaw>(await mql.buffer('https://example.com', apiOptions, gotOpts))
  expectType<typeof mql.arrayBuffer>(mql.buffer)
  expectError(mql.fetchFromApi('https://example.com'))
  expectError(mql.fetchFromApi('https://example.com', {}))
  expectType<MqlResponse | HTTPResponseRaw>(
    await mql.fetchFromApi(...mql.getApiUrl('https://example.com', opts, gotOpts))
  )
  expectType<MqlResponse>(
    await mql.fetchFromApi('https://example.com', { responseType: 'json' })
  )
  expectType<HTTPResponseRaw>(
    await mql.fetchFromApi('https://example.com', { responseType: 'arrayBuffer' })
  )
}
void request()

const client = mql.extend({ headers: { 'x-api-key': 'MyApiToken' } })
expectType<Promise<MqlResponse>>(client('https://example.com', opts, gotOpts))
expectType<Promise<HTTPResponseRaw>>(client('https://example.com', { embed: 'screenshot.url' }))
expectType<Promise<HTTPResponseRaw>>(client('https://example.com', { stream: 'screenshot' }))
expectType<Promise<MqlResponse>>(client('https://example.com', { stream: '' }))
expectType<Promise<MqlResponse>>(client('https://example.com', { embed: '' }))
expectError(client.arrayBuffer)
expectError(client.buffer)
expectError(client.extend)
expectError(client.fetchFromApi)
expectError(client.getApiUrl)
expectError(client.mapRules)
expectError(client.MicrolinkError)
expectError(client.stream)
expectError(client.version)

expectType<Record<string, string> | undefined>(mql.mapRules())
expectType<Record<string, string> | undefined>(mql.mapRules({ title: { selector: 'title' } }))
expectType<string>(mql.version)

expectAssignable<MqlErrorProps['status']>('success')

const props: MqlErrorProps = { code: 'EFAKE', status: 'fail', message: 'fake' }
expectError(new mql.MicrolinkError({ status: 'fail', message: 'fake' }))
expectError(new mql.MicrolinkError({ code: 'EFAKE', message: 'fake' }))
expectError(new mql.MicrolinkError({ code: 'EFAKE', status: 'fail' }))
const error = new mql.MicrolinkError({
  ...props,
  cause: new Error('root'),
  headers: { 'content-type': 'application/json' },
  statusCode: 500
})
expectAssignable<Error>(error)
expectType<MqlError['description']>(error.description)
expectType<string>(error.code)
expectType<typeof mql.MicrolinkError>(mql.MicrolinkError)
