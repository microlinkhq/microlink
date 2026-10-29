import { expectAssignable, expectType } from 'tsd'
import microlinkFn = require('@microlink/function')
import mql = require('@microlink/mql')
import type {
  FunctionArgs,
  FunctionFulfilled,
  FunctionInput,
  FunctionProfiling,
  FunctionRejected,
  FunctionResponse
} from '@microlink/function'

type HasDefault = 'default' extends keyof typeof microlinkFn ? true : false
expectType<false>(false as HasDefault)

const code: FunctionInput = ({ page }: FunctionArgs) => page.title()
const fn = microlinkFn(code, { meta: false })

async function run (): Promise<void> {
  const response = await fn('https://microlink.io')
  expectType<FunctionResponse>(response)
  expectAssignable<FunctionProfiling>(response.profiling)
  if (response.isFulfilled) expectType<FunctionFulfilled>(response)
  else expectType<FunctionRejected>(response)
}
void run()

expectType<Promise<string>>(microlinkFn.compress(code))
expectType<Promise<string>>(microlinkFn.compress('() => 1'))
expectType<string>(microlinkFn.version)
expectType<typeof mql>(microlinkFn.mql)
