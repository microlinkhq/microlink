'use strict'

const createGoogleClient = require('@microlink/google')
const fn = require('@microlink/function')
const mql = require('@microlink/mql')

const CONTENT_KEYS = ['selector', 'selectorAll', 'type']

const COLLECTION_KEYS = ['selector', 'selectorAll', 'attr', 'type']

const SCREENSHOT_KEYS = [
  'fullPage',
  'type',
  'overlay',
  'element',
  'omitBackground',
  'optimizeForSpeed',
  'codeScheme',
  'animated',
  'palette'
]

const PDF_KEYS = [
  'format',
  'margin',
  'scale',
  'landscape',
  'pageRanges',
  'width',
  'height',
  'printBackground'
]

const EMBED_KEYS = ['maxWidth', 'maxHeight']

const LOGO_KEYS = ['square']

const LIGHTHOUSE_KEYS = ['onlyCategories', 'onlyAudits', 'skipAudits', 'output']

const isEmpty = obj => Object.keys(obj).length === 0

const create = (ctx = {}) => {
  /**
   * Split the single options bag into the three destinations mql has:
   * `got.headers` (HTTP layer, 3rd arg), `sub` (capability nested keys)
   * and `top` (top-level query params, 2nd arg). Client context is
   * merged first so per-call options can override it.
   */
  const route = (opts, nested = []) => {
    const top = {}
    const sub = {}
    let got
    for (const [key, value] of Object.entries({ ...ctx, ...opts })) {
      if (key === 'headers') got = { headers: value }
      else if (nested.includes(key)) sub[key] = value
      else top[key] = value
    }
    return { top, sub, got }
  }

  const content = field => (url, options) => {
    const { top, sub, got } = route(options, CONTENT_KEYS)
    return mql(
      url,
      { ...top, meta: false, data: { [field]: { attr: field, ...sub } } },
      got
    ).then(({ data }) => data[field])
  }

  const collection = (field, rule) => (url, options) => {
    const { top, sub, got } = route(options, COLLECTION_KEYS)
    return mql(
      url,
      { ...top, meta: false, data: { [field]: { ...rule, ...sub } } },
      got
    ).then(({ data }) => data[field])
  }

  const capability = (field, nested) => (url, options) => {
    const { top, sub, got } = route(options, nested)
    return mql(
      url,
      { ...top, meta: false, [field]: isEmpty(sub) ? true : sub },
      got
    ).then(({ data }) => data[field])
  }

  const googleClient = createGoogleClient()

  const run = (url, code, options) => {
    const { top, got } = route(options)
    return fn(code, top, got)(url)
  }

  return {
    metadata: (url, options) => {
      const { top, got } = route(options)
      return mql(url, top, got).then(({ data }) => data)
    },
    logo: (url, options) => {
      const { top, sub, got } = route(options, LOGO_KEYS)
      return mql(
        url,
        { ...top, meta: isEmpty(sub) ? true : { logo: sub } },
        got
      ).then(({ data }) => data.logo)
    },
    markdown: content('markdown'),
    html: content('html'),
    text: content('text'),
    links: collection('links', { selectorAll: 'a', attr: 'href', type: 'url' }),
    images: collection('images', {
      selectorAll: 'img',
      attr: 'src',
      type: 'url'
    }),
    videos: collection('videos', {
      selectorAll: ['video[src]', 'video source[src]'],
      attr: 'src',
      type: 'url'
    }),
    audios: collection('audios', {
      selectorAll: ['audio[src]', 'audio source[src]'],
      attr: 'src',
      type: 'url'
    }),
    extract: (url, rules, options) => {
      const { top, got } = route(options)
      return mql(url, { ...top, meta: false, data: rules }, got).then(
        ({ data }) => data
      )
    },
    screenshot: capability('screenshot', SCREENSHOT_KEYS),
    pdf: capability('pdf', PDF_KEYS),
    embed: (url, options) => {
      const { top, sub, got } = route(options, EMBED_KEYS)
      return mql(
        url,
        { ...top, meta: false, iframe: isEmpty(sub) ? true : sub },
        got
      ).then(({ data }) => data.iframe)
    },
    technologies: (url, options) => {
      const { top, got } = route(options)
      return mql(
        url,
        {
          ...top,
          meta: false,
          insights: { technologies: true, lighthouse: false }
        },
        got
      ).then(({ data }) => data.insights.technologies)
    },
    lighthouse: (url, options) => {
      const { top, sub, got } = route(options, LIGHTHOUSE_KEYS)
      return mql(
        url,
        {
          ...top,
          meta: false,
          insights: {
            technologies: false,
            lighthouse: isEmpty(sub) ? true : sub
          }
        },
        got
      ).then(({ data }) => data.insights.lighthouse)
    },
    search: (query, options) => {
      const { top } = route(options)
      return googleClient(query, top)
    },
    function: run,
    run
  }
}

module.exports = create
module.exports.MicrolinkError = mql.MicrolinkError
