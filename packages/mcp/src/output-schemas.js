import { z } from 'zod'

// Output schemas for every tool's `structuredContent.data` value.
// They mirror the TypeScript definitions that ship with the library
// (packages/core/src/index.d.ts, packages/search/src/index.d.ts), which are
// the canonical contract for response shapes. Index signatures map to
// `.catchall(z.unknown())` so forward-compatible API fields always validate.

// `Asset` (packages/core/src/index.d.ts).
const assetSchema = z
  .object({
    url: z.string(),
    type: z.string().optional(),
    size: z.number().optional(),
    size_pretty: z.string().optional(),
    width: z.number().optional(),
    height: z.number().optional()
  })
  .catchall(z.unknown())

// logo/video/audio return `Asset | null`: the primary media field is null
// when the page has no detectable asset.
const nullableAssetSchema = assetSchema.nullable()

// `Metadata` (packages/core/src/index.d.ts).
const metadataSchema = z
  .object({
    title: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    url: z.string().nullable().optional()
  })
  .catchall(z.unknown())

// `Embed` (packages/core/src/index.d.ts).
const embedSchema = z
  .object({
    html: z.string(),
    scripts: z.array(z.unknown()).optional()
  })
  .catchall(z.unknown())

// `FunctionResult<unknown>` (packages/core/src/index.d.ts); profiling and
// logging are optional because the API may omit them.
const functionResultSchema = z
  .object({
    isFulfilled: z.boolean(),
    value: z.unknown(),
    profiling: z.record(z.string(), z.unknown()).optional(),
    logging: z.record(z.string(), z.unknown()).optional()
  })
  .catchall(z.unknown())

// Search pages (packages/search/src/index.d.ts) projected to JSON: the lazy
// helpers (`html()`, `markdown()`, `next()`) are functions and never reach
// the wire. One tolerant shape covers every vertical, including autocomplete
// (`{ value }` results).
const searchResultSchema = z
  .object({
    title: z.string().optional(),
    url: z.string().optional(),
    description: z.string().optional(),
    value: z.string().optional()
  })
  .catchall(z.unknown())

const searchPageSchema = z
  .object({
    results: z.array(searchResultSchema),
    knowledgeGraph: z.record(z.string(), z.unknown()).optional(),
    peopleAlsoAsk: z.array(z.record(z.string(), z.unknown())).optional(),
    relatedSearches: z.array(z.record(z.string(), z.unknown())).optional()
  })
  .catchall(z.unknown())

// Content rules return null when the selector matches nothing
// (verified against the live API: data.markdown/text are null on no match).
const stringSchema = z.string().nullable()
const stringArraySchema = z.array(z.string())
const recordSchema = z.record(z.string(), z.unknown())
const unknownArraySchema = z.array(z.unknown())

export const outputSchemas = {
  metadata: metadataSchema,
  logo: nullableAssetSchema,
  markdown: stringSchema,
  html: stringSchema,
  text: stringSchema,
  screenshot: assetSchema,
  pdf: assetSchema,
  embed: embedSchema,
  video: nullableAssetSchema,
  audio: nullableAssetSchema,
  links: stringArraySchema,
  images: stringArraySchema,
  videos: stringArraySchema,
  audios: stringArraySchema,
  emails: stringArraySchema,
  technologies: unknownArraySchema,
  lighthouse: recordSchema,
  search: searchPageSchema,
  function: functionResultSchema,
  extract: recordSchema
}
