import microlinkMql = require('@microlink/mql')
// @ts-ignore puppeteer-core is an optional peer dependency: without it, Page and HTTPResponse are any
import type { HTTPResponse, Page } from 'puppeteer-core' with { 'resolution-mode': 'import' }

declare function microlinkFunction(
  fn: microlinkFunction.FunctionInput,
  mqlOpts?: microlinkMql.MqlOptions,
  gotOpts?: object
): (
  url: string,
  mqlOpts?: microlinkMql.MqlOptions,
  gotOpts?: object
) => Promise<microlinkFunction.FunctionResponse>

declare namespace microlinkFunction {
  type FunctionProfiling = {
    phases?: {
      install?: number
      build?: number
      spawn?: number
      run?: number
      total?: number
    }
    cpu?: number
    memory?: {
      total?: number
      used?: number
      heap?: number
      external?: number
    }
    size?: number
  }

  type FunctionFulfilled = {
    isFulfilled: true
    value: any
    profiling: FunctionProfiling
    logging: Record<string, unknown>
  }

  type FunctionRejected = {
    isFulfilled: false
    value: {
      name: string
      message: string
      [key: string]: unknown
    }
    profiling: FunctionProfiling
    logging: Record<string, unknown>
  }

  type FunctionResponse = FunctionFulfilled | FunctionRejected

  type FunctionArgs = {
    page: Page
    response: HTTPResponse
    headers: Record<string, string>
    url: string
    [key: string]: any
  }

  type FunctionInput = (args: FunctionArgs) => any

  function compress(code: FunctionInput | string): Promise<string>
  const mql: typeof microlinkMql
  const version: string
}

export = microlinkFunction
