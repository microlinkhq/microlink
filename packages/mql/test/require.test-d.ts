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

async function request (): Promise<void> {
  const response = await mql('https://example.com', opts)
  expectType<MqlResponse>(response)
  expectAssignable<MqlPayload>(response)
  expectType<MqlResponseData>(response.data)
  expectType<HTTPResponseRaw>(await mql('https://example.com', { embed: 'screenshot.url' }))
  expectType<HTTPResponseRaw>(await mql.arrayBuffer('https://example.com', apiOptions))
  expectType<HTTPResponseRaw>(await mql.buffer('https://example.com'))
  expectType<MqlResponse | HTTPResponseRaw>(await mql.fetchFromApi(...mql.getApiUrl('https://example.com')))
}
void request()

const client = mql.extend({ headers: { 'x-api-key': 'MyApiToken' } })
expectType<Promise<MqlResponse>>(client('https://example.com'))
expectError(client.extend)
expectError(client.version)

expectType<Record<string, string> | undefined>(mql.mapRules({ title: { selector: 'title' } }))
expectType<string>(mql.version)

const props: MqlErrorProps = { code: 'EFAKE', status: 'fail', message: 'fake' }
const error = new mql.MicrolinkError(props)
expectAssignable<Error>(error)
expectType<MqlError['description']>(error.description)
expectType<string>(error.code)
expectType<typeof mql.MicrolinkError>(mql.MicrolinkError)
