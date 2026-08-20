import { z } from 'zod'

const stringOrStringArraySchema = z.union([
  z.string(),
  z.array(z.string()).min(1)
])
const stringOrNumberSchema = z.union([z.string(), z.number()])

function coerceJsonObjectString (value) {
  if (typeof value !== 'string') {
    return value
  }

  const input = value.trim()
  if (input.length < 2 || !input.startsWith('{') || !input.endsWith('}')) {
    return value
  }

  try {
    const parsed = JSON.parse(input)
    if (
      parsed !== null &&
      typeof parsed === 'object' &&
      !Array.isArray(parsed)
    ) {
      return parsed
    }
  } catch {
    // Keep original value and let schema validation surface the error.
  }

  return value
}

function coerceBooleanString (value) {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (normalized === 'true') return true
    if (normalized === 'false') return false
  }

  return value
}

const booleanSchema = z.preprocess(coerceBooleanString, z.boolean())
const objectLikeSchema = schema => z.preprocess(coerceJsonObjectString, schema)
const toggledObjectSchema = z.union([
  booleanSchema,
  objectLikeSchema(z.object({}).catchall(z.unknown()))
])
const proxySchema = objectLikeSchema(
  z.union([z.string().min(1), z.object({}).catchall(z.unknown())])
)

// A CSS selector or an array of selectors (ordered fallbacks / unioned matches),
// matching what the Microlink API and the microlink.io library accept.
const selectorSchema = z.union([
  z.string().min(1),
  z.array(z.string().min(1)).min(1)
])

// A single data-extraction rule: CSS selector(s) + optional attr/type/evaluate/nested data.
const dataSingleRuleSchema = objectLikeSchema(
  z
    .object({
      selector: selectorSchema.optional(),
      selectorAll: selectorSchema.optional(),
      attr: z.string().min(1).optional(),
      type: z.string().min(1).optional(),
      evaluate: z.string().min(1).optional(),
      data: z.record(z.string(), z.unknown()).optional()
    })
    .catchall(z.unknown())
)

// A rule can also be an array of rules used as ordered fallback selectors.
const dataRuleSchema = z.union([
  dataSingleRuleSchema,
  z.array(dataSingleRuleSchema).min(1)
])

const waitUntilEventSchema = z.enum([
  'auto',
  'load',
  'domcontentloaded',
  'networkidle0',
  'networkidle2'
])

const viewportSchema = objectLikeSchema(
  z
    .object({
      width: z.number().positive().optional(),
      height: z.number().positive().optional(),
      deviceScaleFactor: z.number().positive().optional(),
      isMobile: booleanSchema.optional(),
      hasTouch: booleanSchema.optional(),
      isLandscape: booleanSchema.optional()
    })
    .strict()
)

const screenshotOverlaySchema = objectLikeSchema(
  z
    .object({
      browser: z.enum(['light', 'dark']).optional(),
      background: z.string().min(1).optional()
    })
    .strict()
)

export const screenshotConfigSchema = objectLikeSchema(
  z
    .object({
      animated: booleanSchema.optional(),
      codeScheme: z.string().min(1).optional(),
      element: z.string().min(1).optional(),
      fullPage: booleanSchema.optional(),
      omitBackground: booleanSchema.optional(),
      optimizeForSpeed: booleanSchema.optional(),
      overlay: screenshotOverlaySchema.optional(),
      palette: booleanSchema.optional(),
      quality: z.number().min(0).max(100).optional(),
      type: z.enum(['jpeg', 'png']).optional()
    })
    .strict()
)

const pdfMarginSchema = objectLikeSchema(
  z.union([
    z.string().min(1),
    z
      .object({
        top: z.string().min(1).optional(),
        bottom: z.string().min(1).optional(),
        left: z.string().min(1).optional(),
        right: z.string().min(1).optional()
      })
      .strict()
  ])
)

export const pdfConfigSchema = objectLikeSchema(
  z
    .object({
      format: z
        .enum([
          'Letter',
          'Legal',
          'Tabloid',
          'Ledger',
          'A0',
          'A1',
          'A2',
          'A3',
          'A4',
          'A5',
          'A6'
        ])
        .optional(),
      height: z.string().min(1).optional(),
      landscape: booleanSchema.optional(),
      margin: pdfMarginSchema.optional(),
      pageRanges: z.string().min(1).optional(),
      scale: z.number().min(0.1).max(2).optional(),
      width: z.string().min(1).optional()
    })
    .strict()
)

const lighthouseOutputSchema = z.enum(['json', 'html', 'csv'])
const lighthousePresetSchema = z.enum([
  'default',
  'desktop',
  'experimental',
  'full',
  'lr-desktop',
  'lr-mobile',
  'perf'
])

const lighthouseConfigSchema = objectLikeSchema(
  z
    .object({
      output: lighthouseOutputSchema.optional(),
      onlyCategories: stringOrStringArraySchema.optional(),
      preset: lighthousePresetSchema.optional()
    })
    .catchall(z.unknown())
)

export const insightsConfigSchema = objectLikeSchema(
  z
    .object({
      lighthouse: z.union([booleanSchema, lighthouseConfigSchema]).optional(),
      technologies: booleanSchema.optional()
    })
    .strict()
)

export const metaConfigSchema = objectLikeSchema(
  z
    .object({
      author: booleanSchema.optional(),
      date: booleanSchema.optional(),
      description: booleanSchema.optional(),
      image: booleanSchema.optional(),
      lang: booleanSchema.optional(),
      logo: booleanSchema.optional(),
      publisher: booleanSchema.optional(),
      title: booleanSchema.optional(),
      url: booleanSchema.optional()
    })
    .strict()
)

const baseSchema = z.object({
  url: z.string().url(),
  apiKey: z.string().min(1).optional()
})

const fullShape = {
  embed: z.string().min(1).optional(),
  function: z.string().min(1).optional(),
  iframe: toggledObjectSchema.optional(),
  meta: z.union([booleanSchema, metaConfigSchema]).optional(),
  palette: booleanSchema.optional(),
  ping: toggledObjectSchema.optional()
}

// Shared locator fields for interaction actions (exactly one strategy preferred;
// the API enforces mutual exclusivity — agents may omit and use CSS `selector`).
const locatorFields = {
  selector: z.string().min(1).optional(),
  role: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  text: z.string().min(1).optional(),
  label: z.string().min(1).optional(),
  placeholder: z.string().min(1).optional(),
  testId: z.string().min(1).optional(),
  alt: z.string().min(1).optional()
}

const actionSchema = z.discriminatedUnion('type', [
  z
    .object({
      type: z.literal('inject'),
      styles: stringOrStringArraySchema.optional(),
      scripts: stringOrStringArraySchema.optional(),
      modules: stringOrStringArraySchema.optional()
    })
    .strict(),
  z
    .object({
      type: z.literal('click'),
      ...locatorFields
    })
    .strict(),
  z
    .object({
      type: z.literal('wait'),
      timeout: stringOrNumberSchema.optional(),
      request: z.string().min(1).optional(),
      visible: booleanSchema.optional(),
      hidden: booleanSchema.optional(),
      ...locatorFields
    })
    .strict(),
  z
    .object({
      type: z.literal('scroll'),
      x: z.number().optional(),
      y: z.number().optional(),
      ...locatorFields
    })
    .strict(),
  z
    .object({
      type: z.literal('fill'),
      value: z.string(),
      ...locatorFields
    })
    .strict(),
  z
    .object({
      type: z.literal('evaluate'),
      expression: z.string().min(1)
    })
    .strict(),
  z
    .object({
      type: z.literal('screenshot'),
      fullPage: booleanSchema.optional(),
      ...locatorFields
    })
    .strict(),
  z
    .object({
      type: z.literal('pdf'),
      format: z.string().min(1).optional(),
      scale: z.number().optional(),
      margin: pdfMarginSchema.optional(),
      printBackground: booleanSchema.optional()
    })
    .strict()
])

// Shared Microlink API query parameters (see microlink.io/docs/api/parameters).
// Product tools layer their own fields on top; these apply to any URL fetch.
// `data` is separate: content/collection helpers overwrite it with their field rule.
const browserSchema = {
  actions: z.array(actionSchema).min(1).optional(),
  adblock: booleanSchema.optional(),
  animations: booleanSchema.optional(),
  cacheKey: z.string().min(1).optional(),
  click: stringOrStringArraySchema.optional(),
  colorScheme: z.enum(['no-preference', 'light', 'dark']).optional(),
  device: z.string().min(1).optional(),
  filename: z.string().min(1).optional(),
  filter: z.string().min(1).optional(),
  force: booleanSchema.optional(),
  headers: objectLikeSchema(
    z.record(z.string(), z.union([z.string(), z.number(), booleanSchema]))
  ).optional(),
  javascript: booleanSchema.optional(),
  mediaType: z.enum(['screen', 'print']).optional(),
  modules: stringOrStringArraySchema.optional(),
  prerender: z.union([z.literal('auto'), booleanSchema]).optional(),
  proxy: proxySchema.optional(),
  retry: z.number().int().nonnegative().optional(),
  scripts: stringOrStringArraySchema.optional(),
  scroll: z.string().min(1).optional(),
  staleTtl: z.union([z.string(), z.number(), booleanSchema]).optional(),
  styles: stringOrStringArraySchema.optional(),
  timeout: stringOrNumberSchema.optional(),
  ttl: stringOrNumberSchema.optional(),
  viewport: viewportSchema.optional(),
  waitForSelector: z.string().min(1).optional(),
  waitForTimeout: stringOrNumberSchema.optional(),
  waitUntil: z
    .union([waitUntilEventSchema, z.array(waitUntilEventSchema).min(1)])
    .optional()
}

const visualSchema = {
  ...browserSchema,
  data: objectLikeSchema(z.record(z.string(), dataRuleSchema)).optional()
}

export const extractInputSchema = baseSchema
  .extend(fullShape)
  .extend(visualSchema)
  .extend({
    audio: booleanSchema.optional(),
    video: booleanSchema.optional(),
    pdf: z.union([booleanSchema, pdfConfigSchema]).optional(),
    screenshot: z.union([booleanSchema, screenshotConfigSchema]).optional(),
    insights: z.union([booleanSchema, insightsConfigSchema]).optional()
  })
  .strict()

export const screenshotInputSchema = baseSchema
  .extend(visualSchema)
  .extend({
    screenshot: z.union([booleanSchema, screenshotConfigSchema]).optional()
  })
  .strict()

export const pdfInputSchema = baseSchema
  .extend(visualSchema)
  .extend({
    pdf: z.union([booleanSchema, pdfConfigSchema]).optional()
  })
  .strict()

export const audioInputSchema = baseSchema
  .extend(visualSchema)
  .extend({
    meta: z.union([booleanSchema, metaConfigSchema]).optional(),
    audio: booleanSchema.optional()
  })
  .strict()

export const videoInputSchema = baseSchema
  .extend(visualSchema)
  .extend({
    meta: z.union([booleanSchema, metaConfigSchema]).optional(),
    video: booleanSchema.optional()
  })
  .strict()

export const logoInputSchema = baseSchema
  .extend(visualSchema)
  .extend({
    square: booleanSchema.optional(),
    palette: booleanSchema.optional()
  })
  .strict()

export const metadataInputSchema = baseSchema
  .extend(visualSchema)
  .extend({
    meta: z.union([booleanSchema, metaConfigSchema]).optional(),
    palette: booleanSchema.optional()
  })
  .strict()

// Content tools (markdown/html/text) accept a selector to scope the extraction.
const contentSchema = baseSchema
  .extend(browserSchema)
  .extend({
    selector: selectorSchema.optional(),
    selectorAll: selectorSchema.optional(),
    type: z.string().min(1).optional()
  })
  .strict()

// Collection tools accept selector/attr/type overrides for the data rule.
const collectionSchema = baseSchema
  .extend(browserSchema)
  .extend({
    selector: selectorSchema.optional(),
    selectorAll: selectorSchema.optional(),
    attr: z.string().min(1).optional(),
    type: z.string().min(1).optional()
  })
  .strict()

export const markdownInputSchema = contentSchema

export const htmlInputSchema = contentSchema

export const textInputSchema = contentSchema

export const embedInputSchema = baseSchema
  .extend(visualSchema)
  .extend({
    maxWidth: z.coerce.number().int().positive().optional(),
    maxHeight: z.coerce.number().int().positive().optional()
  })
  .strict()

export const linksInputSchema = collectionSchema

export const imagesInputSchema = collectionSchema

export const videosInputSchema = collectionSchema

export const audiosInputSchema = collectionSchema

export const emailsInputSchema = collectionSchema

export const technologiesInputSchema = baseSchema.extend(visualSchema).strict()

export const lighthouseInputSchema = baseSchema
  .extend(visualSchema)
  .extend({
    onlyCategories: z.array(z.string().min(1)).optional(),
    onlyAudits: z.array(z.string().min(1)).optional(),
    skipAudits: z.array(z.string().min(1)).optional(),
    output: z.union([z.string().min(1), z.array(z.string().min(1))]).optional()
  })
  .strict()

export const searchInputSchema = z
  .object({
    query: z.string().min(1),
    apiKey: z.string().min(1).optional(),
    type: z
      .enum([
        'search',
        'news',
        'images',
        'videos',
        'places',
        'maps',
        'shopping',
        'scholar',
        'patents',
        'autocomplete'
      ])
      .optional(),
    limit: z.coerce.number().int().positive().optional(),
    location: z.string().min(1).optional(),
    period: z.enum(['hour', 'day', 'week', 'month', 'year']).optional()
  })
  .strict()

export const functionInputSchema = baseSchema
  .extend(visualSchema)
  .extend({
    code: z.string().min(1)
  })
  .strict()
