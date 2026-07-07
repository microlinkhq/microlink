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

// A single data-extraction rule: CSS selector(s) + optional attr/type/evaluate/nested data.
const dataSingleRuleSchema = objectLikeSchema(
  z
    .object({
      selector: z.string().min(1).optional(),
      selectorAll: z.string().min(1).optional(),
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
      codeScheme: z.string().min(1).optional(),
      element: z.string().min(1).optional(),
      fullPage: booleanSchema.optional(),
      omitBackground: booleanSchema.optional(),
      overlay: screenshotOverlaySchema.optional(),
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

const visualSchema = {
  adblock: booleanSchema.optional(),
  animations: booleanSchema.optional(),
  click: stringOrStringArraySchema.optional(),
  colorScheme: z.enum(['no-preference', 'light', 'dark']).optional(),
  data: objectLikeSchema(z.record(z.string(), dataRuleSchema)).optional(),
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

export const technologiesInputSchema = baseSchema.strict()

export const lighthouseInputSchema = baseSchema.strict()

export const audioInputSchema = baseSchema
  .extend({
    proxy: proxySchema.optional(),
    meta: z.union([booleanSchema, metaConfigSchema]).optional(),
    audio: booleanSchema.optional()
  })
  .strict()

export const videoInputSchema = baseSchema
  .extend({
    proxy: proxySchema.optional(),
    meta: z.union([booleanSchema, metaConfigSchema]).optional(),
    video: booleanSchema.optional()
  })
  .strict()

export const logoInputSchema = baseSchema
  .extend({
    square: booleanSchema.optional()
  })
  .strict()

export const metadataInputSchema = baseSchema
  .extend({
    meta: z.union([booleanSchema, metaConfigSchema]).optional()
  })
  .strict()

export const markdownInputSchema = baseSchema.strict()

export const htmlInputSchema = baseSchema.strict()

export const textInputSchema = baseSchema.strict()

export const embedInputSchema = baseSchema.strict()

export const linksInputSchema = baseSchema.strict()

export const imagesInputSchema = baseSchema.strict()

export const videosInputSchema = baseSchema.strict()

export const audiosInputSchema = baseSchema.strict()

export const emailsInputSchema = baseSchema.strict()
