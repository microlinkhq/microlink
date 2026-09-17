import { products as DOC_PRODUCTS } from 'microlink.io/docs'
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
      browser: z
        .enum(['light', 'dark'])
        .optional()
        .describe('Browser chrome theme for the overlay.'),
      background: z
        .string()
        .min(1)
        .optional()
        .describe('Overlay background color (CSS color).')
    })
    .strict()
)

export const screenshotConfigSchema = objectLikeSchema(
  z
    .object({
      animated: booleanSchema
        .optional()
        .describe(
          'Capture an animated screenshot (GIF/MP4) instead of a still.'
        ),
      codeScheme: z
        .string()
        .min(1)
        .optional()
        .describe(
          'Syntax-highlight theme for code pages (for example dracula).'
        ),
      element: z
        .string()
        .min(1)
        .optional()
        .describe('CSS selector of the element to capture.'),
      fullPage: booleanSchema
        .optional()
        .describe('Capture the full scrollable page.'),
      omitBackground: booleanSchema
        .optional()
        .describe('Transparent background (png).'),
      optimizeForSpeed: booleanSchema
        .optional()
        .describe('Faster encode, larger file.'),
      overlay: screenshotOverlaySchema
        .optional()
        .describe('Browser chrome overlay.'),
      palette: booleanSchema
        .optional()
        .describe('Also extract dominant colors.'),
      quality: z
        .number()
        .min(0)
        .max(100)
        .optional()
        .describe('JPEG quality (0–100).'),
      type: z
        .enum(['jpeg', 'png'])
        .optional()
        .describe('Image format. Default png.')
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
        .optional()
        .describe('Page format. Default A4.'),
      height: z
        .string()
        .min(1)
        .optional()
        .describe('Page height (CSS length).'),
      landscape: booleanSchema.optional().describe('Landscape orientation.'),
      margin: pdfMarginSchema
        .optional()
        .describe('Margin as a CSS length or { top, bottom, left, right }.'),
      pageRanges: z
        .string()
        .min(1)
        .optional()
        .describe('Pages to print, for example 1-3.'),
      scale: z.number().min(0.1).max(2).optional().describe('Scale (0.1–2).'),
      width: z.string().min(1).optional().describe('Page width (CSS length).')
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

const optionalApiKey = description =>
  z.string().min(1).optional().describe(description)

const baseSchema = z.object({
  url: z
    .string()
    .url()
    .describe(
      'Public URL of the page to process. Include the protocol, for example https://example.com.'
    ),
  apiKey: optionalApiKey(
    'Microlink PRO API key. Omit it unless you have one: requests then use the MICROLINK_API_KEY environment variable or the free endpoint.'
  )
})

const fullShape = {
  embed: z.string().min(1).optional(),
  function: z.string().min(1).optional(),
  iframe: toggledObjectSchema.optional(),
  meta: z.union([booleanSchema, metaConfigSchema]).optional(),
  palette: booleanSchema.optional(),
  ping: toggledObjectSchema.optional()
}

// Shared Microlink API query parameters (see microlink.io/docs/api/parameters).
// Product tools layer their own fields on top; these apply to any URL fetch.
// `data` is separate: content/collection helpers overwrite it with their field rule.
// PRO parameters per the Microlink API spec (https://microlink.io/openapi.json):
// they only take effect with an API key attached to the request.
const PRO = 'PRO: requires a Microlink API key (Pro plan).'

const browserSchema = {
  adblock: booleanSchema.optional(),
  animations: booleanSchema.optional(),
  cacheKey: z
    .string()
    .min(1)
    .optional()
    .describe(`Custom cache key for the request. ${PRO}`),
  click: stringOrStringArraySchema
    .optional()
    .describe('CSS selector(s) to click before capture.'),
  colorScheme: z
    .enum(['no-preference', 'light', 'dark'])
    .optional()
    .describe('Preferred color scheme.'),
  device: z
    .string()
    .min(1)
    .optional()
    .describe('Emulate a device, for example iPhone 12.'),
  filename: z
    .string()
    .min(1)
    .optional()
    .describe(`Custom name for the generated asset. ${PRO}`),
  filter: z.string().min(1).optional(),
  force: booleanSchema.optional().describe('Bypass cache.'),
  headers: objectLikeSchema(
    z.record(z.string(), z.union([z.string(), z.number(), booleanSchema]))
  )
    .optional()
    .describe(`Custom HTTP headers sent to the target URL. ${PRO}`),
  javascript: booleanSchema
    .optional()
    .describe('Toggle JavaScript execution on the target page.'),
  mediaType: z.enum(['screen', 'print']).optional(),
  modules: stringOrStringArraySchema.optional(),
  prerender: z.union([z.literal('auto'), booleanSchema]).optional(),
  proxy: proxySchema
    .optional()
    .describe(
      `Proxy rotation to bypass IP rate limits, CAPTCHAs and regional restrictions. ${PRO}`
    ),
  retry: z.number().int().nonnegative().optional(),
  scripts: stringOrStringArraySchema.optional(),
  scroll: z
    .string()
    .min(1)
    .optional()
    .describe('CSS selector to scroll into view before capture.'),
  staleTtl: z
    .union([z.string(), z.number(), booleanSchema])
    .optional()
    .describe(
      `Serve stale cached content while refreshing it in the background. ${PRO}`
    ),
  styles: stringOrStringArraySchema.optional(),
  timeout: stringOrNumberSchema.optional(),
  ttl: stringOrNumberSchema.optional(),
  viewport: viewportSchema.optional(),
  waitForSelector: z
    .string()
    .min(1)
    .optional()
    .describe('Wait for this CSS selector before capture.'),
  waitForTimeout: stringOrNumberSchema.optional(),
  waitUntil: z
    .union([waitUntilEventSchema, z.array(waitUntilEventSchema).min(1)])
    .optional()
    .describe(
      'Navigation event to wait for: auto, load, domcontentloaded, networkidle0, networkidle2.'
    )
}

const visualSchema = {
  ...browserSchema,
  data: objectLikeSchema(z.record(z.string(), dataRuleSchema))
    .optional()
    .describe('Custom MQL data rules (selector, attr, type).')
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
    screenshot: z
      .union([booleanSchema, screenshotConfigSchema])
      .optional()
      .describe(
        'true for defaults, or an object (fullPage, element, type, overlay, animated).'
      )
  })
  .strict()

export const pdfInputSchema = baseSchema
  .extend(visualSchema)
  .extend({
    pdf: z
      .union([booleanSchema, pdfConfigSchema])
      .optional()
      .describe('true for defaults, or an object (format, margin, landscape).')
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
    square: booleanSchema
      .optional()
      .describe('Prefer the square (icon-shaped) logo variant.'),
    palette: booleanSchema.optional()
  })
  .strict()

export const metadataInputSchema = baseSchema
  .extend(visualSchema)
  .extend({
    meta: z
      .union([booleanSchema, metaConfigSchema])
      .optional()
      .describe(
        'true to include metadata, false to skip, or an object to include/exclude fields.'
      ),
    palette: booleanSchema.optional()
  })
  .strict()

// Content tools (markdown/html/text) accept a selector to scope the extraction.
const contentSchema = baseSchema
  .extend(browserSchema)
  .extend({
    selector: selectorSchema
      .optional()
      .describe('CSS selector to scope the extracted content.'),
    selectorAll: selectorSchema.optional(),
    type: z.string().min(1).optional()
  })
  .strict()

// Collection tools accept selector/attr/type overrides for the data rule.
const collectionSchema = baseSchema
  .extend(browserSchema)
  .extend({
    selector: selectorSchema.optional(),
    selectorAll: selectorSchema
      .optional()
      .describe('CSS selector(s) matching many nodes.'),
    attr: z
      .string()
      .min(1)
      .optional()
      .describe('Attribute to read (href, src, ...).'),
    type: z.string().min(1).optional()
  })
  .strict()

export const markdownInputSchema = contentSchema

export const htmlInputSchema = contentSchema

export const textInputSchema = contentSchema

export const embedInputSchema = baseSchema
  .extend(visualSchema)
  .extend({
    maxWidth: z.coerce
      .number()
      .int()
      .positive()
      .optional()
      .describe('Maximum iframe width in pixels.'),
    maxHeight: z.coerce
      .number()
      .int()
      .positive()
      .optional()
      .describe('Maximum iframe height in pixels.')
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
    onlyCategories: z
      .array(z.string().min(1))
      .optional()
      .describe('Limit the report to these Lighthouse categories.'),
    onlyAudits: z.array(z.string().min(1)).optional(),
    skipAudits: z.array(z.string().min(1)).optional(),
    output: z
      .union([z.string().min(1), z.array(z.string().min(1))])
      .optional()
      .describe('Report format: json, html, or csv.')
  })
  .strict()

export const searchInputSchema = z
  .object({
    query: z
      .string()
      .min(1)
      .describe(
        'Google search query. Operators like site:, filetype: or quotes work as-is.'
      ),
    apiKey: optionalApiKey(
      'Microlink API key. Required for this tool: Google search runs on the PRO endpoint.'
    ),
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
      .optional()
      .describe('Search vertical. Default search.'),
    limit: z.coerce
      .number()
      .int()
      .positive()
      .optional()
      .describe('Maximum number of results.'),
    page: z.coerce
      .number()
      .int()
      .positive()
      .optional()
      .describe('Results page. Default 1.'),
    location: z
      .string()
      .min(1)
      .optional()
      .describe('Country or locale, for example es.'),
    period: z
      .enum(['hour', 'day', 'week', 'month', 'year'])
      .optional()
      .describe('Recency filter.')
  })
  .strict()

export const functionInputSchema = baseSchema
  .extend(visualSchema)
  .extend({
    code: z
      .string()
      .min(1)
      .describe(
        'Function source, for example "async ({ page }) => page.title()".'
      )
  })
  .strict()

export const docsInputSchema = z
  .object({
    product: z
      .enum(DOC_PRODUCTS, {
        error: `Unknown product. Valid products: ${DOC_PRODUCTS.join(', ')}.`
      })
      .describe('Microlink product whose canonical parameter docs to fetch.')
  })
  .strict()

export const listPlansInputSchema = z.object({}).strict()

export const createCheckoutSessionInputSchema = z
  .object({
    email: z
      .string()
      .email()
      .describe('Email address for the Microlink account and Stripe Checkout.'),
    planId: z.string().min(1).describe('Plan id from `microlink_list_plans`.'),
    label: z
      .string()
      .min(1)
      .optional()
      .default('default')
      .describe('Label for the API key that onboarding creates.'),
    idempotencyKey: z
      .string()
      .min(1)
      .max(255)
      .optional()
      .describe(
        'Stable idempotency key for this logical checkout call. Omit on the first call to generate a UUID; reuse the returned value when retrying.'
      )
  })
  .strict()

export const getCheckoutSessionInputSchema = z
  .object({
    sessionId: z
      .string()
      .min(1)
      .describe(
        'Checkout session id returned by `microlink_create_checkout_session`.'
      )
  })
  .strict()
