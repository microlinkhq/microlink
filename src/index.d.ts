import createGoogleClient from '@microlink/google'

type GoogleClient = ReturnType<typeof createGoogleClient>

/**
 * Transport & top-level API query params. Unknown keys fall through
 * to the API query string, so an index signature is provided.
 */
interface Options {
  apiKey?: string
  endpoint?: string
  headers?: Record<string, string>
  adblock?: boolean
  animations?: boolean
  audio?: boolean
  cacheKey?: string
  click?: string | string[]
  colorScheme?: 'light' | 'dark' | 'no-preference'
  device?: string
  filename?: string
  force?: boolean
  javascript?: boolean
  meta?: boolean
  modules?: string | string[]
  prerender?: boolean | 'auto'
  proxy?: string
  retry?: number
  scripts?: string | string[]
  staleTtl?: string | number
  styles?: string | string[]
  timeout?: number
  ttl?: string | number
  video?: boolean
  viewport?: Record<string, unknown>
  waitForTimeout?: number
  waitUntil?: string | string[]
  [key: string]: unknown
}

interface ContentOptions extends Options {
  selector?: string
  selectorAll?: string | string[]
  type?: string
}

interface CollectionOptions extends Options {
  selector?: string
  selectorAll?: string | string[]
  attr?: string
  type?: string
}

interface ScreenshotOptions extends Options {
  fullPage?: boolean
  type?: 'jpeg' | 'png'
  overlay?: Record<string, unknown>
  element?: string
  omitBackground?: boolean
  optimizeForSpeed?: boolean
  codeScheme?: string
  animated?: boolean
  palette?: boolean
}

interface PdfOptions extends Options {
  format?: string
  margin?: string | Record<string, string | number>
  scale?: number
  landscape?: boolean
  pageRanges?: string
  width?: string | number
  height?: string | number
  printBackground?: boolean
}

interface EmbedOptions extends Options {
  maxWidth?: number
  maxHeight?: number
}

interface LogoOptions extends Options {
  square?: boolean
}

interface LighthouseOptions extends Options {
  onlyCategories?: string[]
  onlyAudits?: string[]
  skipAudits?: string[]
  output?: string | string[]
}

/** Rich asset object (screenshot, pdf, logo, image rules, ...). */
interface Asset {
  url: string
  type?: string
  size?: number
  size_pretty?: string
  width?: number
  height?: number
  [key: string]: unknown
}

interface Metadata {
  title?: string | null
  description?: string | null
  url?: string | null
  [key: string]: unknown
}

interface Embed {
  html: string
  scripts?: unknown[]
  [key: string]: unknown
}

type FunctionInput = string | ((args: Record<string, unknown>) => unknown)

interface FunctionResult<T = unknown> {
  isFulfilled: boolean
  value: T
  profiling: Record<string, unknown>
  logging: Record<string, unknown>
}

export declare class MicrolinkError extends Error {
  status?: string
  code?: string
  statusCode?: number
  description?: string
  url?: string
  headers?: Record<string, string>
  more?: string
  constructor (props: Record<string, unknown>)
}

interface MicrolinkClient {
  metadata (url: string, options?: Options): Promise<Metadata>
  logo (url: string, options?: LogoOptions): Promise<Asset>
  markdown (url: string, options?: ContentOptions): Promise<string>
  html (url: string, options?: ContentOptions): Promise<string>
  text (url: string, options?: ContentOptions): Promise<string>
  video (url: string, options?: Options): Promise<Asset>
  audio (url: string, options?: Options): Promise<Asset>
  emails (url: string, options?: Options): Promise<string[]>
  links (url: string, options?: CollectionOptions): Promise<string[]>
  images (url: string, options?: CollectionOptions): Promise<string[]>
  videos (url: string, options?: CollectionOptions): Promise<string[]>
  audios (url: string, options?: CollectionOptions): Promise<string[]>
  extract (
    url: string,
    rules: Record<string, unknown>,
    options?: Options
  ): Promise<Record<string, unknown>>
  screenshot (url: string, options?: ScreenshotOptions): Promise<Asset>
  pdf (url: string, options?: PdfOptions): Promise<Asset>
  embed (url: string, options?: EmbedOptions): Promise<Embed>
  technologies (url: string, options?: Options): Promise<unknown[]>
  lighthouse (
    url: string,
    options?: LighthouseOptions
  ): Promise<Record<string, unknown>>
  search: GoogleClient
  function<T = unknown> (
    url: string,
    code: FunctionInput,
    options?: Options
  ): Promise<FunctionResult<T>>
  run: MicrolinkClient['function']
}

interface create {
  (options?: Options): MicrolinkClient
  MicrolinkError: typeof MicrolinkError
}

declare const create: create

export default create
