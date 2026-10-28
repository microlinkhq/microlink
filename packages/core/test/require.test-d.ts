import { expectAssignable, expectType } from 'tsd'
import create = require('../src/index.js')
import type {
  FunctionArgs,
  FunctionInput,
  HTTPResponse,
  MicrolinkError,
  MicrolinkHTTPResponse,
  MicrolinkResponse,
  Page
} from '../src/index.js'

type HasDefault = 'default' extends keyof typeof create ? true : false
expectType<false>(false as HasDefault)

const client = create({ apiKey: 'MyApiToken' })
expectType<Promise<string | null>>(client.markdown('https://example.com'))

const error = new create.MicrolinkError({ code: 'EFAKE' })
expectType<MicrolinkError>(error)
expectAssignable<Error>(error)

const code: FunctionInput = ({ page, response }: FunctionArgs) => {
  expectAssignable<Page>(page)
  expectAssignable<HTTPResponse>(response)
  return page.title()
}
void client.function('https://example.com', code)

async function request (): Promise<void> {
  expectType<MicrolinkResponse>(await client.request('https://example.com'))
  expectType<MicrolinkHTTPResponse<ArrayBuffer>>(
    await client.request('https://example.com', { embed: 'screenshot.url' })
  )
}
void request()
