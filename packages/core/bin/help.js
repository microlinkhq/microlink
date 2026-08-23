'use strict'

const { gray, white } = require('./style')

const col = (name, desc) => `  ${white(name.padEnd(21))}   ${gray(desc)}`

const cmd = (rest, comment) =>
  `${comment ? `  ${gray(`# ${comment}`)}\n` : ''}  ${white(
    'microlink'
  )} ${gray(rest)}`

const rows = items => items.map(([name, desc]) => col(name, desc)).join('\n')

const CLI = [
  ['--api-key', 'Microlink API key (defaults to MICROLINK_API_KEY env)'],
  ['--endpoint', 'Microlink API endpoint'],
  ['--header, -H', "Extra request header as 'Name: value' (repeatable)"],
  [
    '--http.header.<name>',
    'HTTP request header (e.g. --http.header.authorization)'
  ],
  ['--trace', 'Print request & response payload (API key masked)'],
  ['--trace-full', 'Same as --trace, including the full API key'],
  ['--help', 'Show this help']
]

const CLI_NO_TRACE = CLI.filter(
  ([name]) => name !== '--trace' && name !== '--trace-full'
)

const BROWSER = [
  ['--adblock', 'Block ads and trackers'],
  ['--animations', 'Enable CSS animations'],
  ['--cacheKey', 'Custom cache key'],
  ['--click', 'CSS selector(s) to click before capture'],
  ['--colorScheme', 'Color scheme: no-preference, light, dark'],
  ['--device', "Emulate a device (e.g. 'iPhone 11')"],
  ['--filename', 'Suggested download filename'],
  ['--filter', 'Pick response fields'],
  ['--force', 'Bypass the cache'],
  ['--javascript', 'Enable or disable JavaScript'],
  ['--mediaType', 'Emulate media: screen, print'],
  ['--modules', 'Inject ES module URLs'],
  ['--prerender', 'Prerender: auto, true, false'],
  ['--proxy', 'Proxy URL or country'],
  ['--retry', 'Retry count'],
  ['--scripts', 'Inject script URLs'],
  ['--scroll', 'CSS selector to scroll into view'],
  ['--staleTtl', 'Stale-while-revalidate TTL'],
  ['--styles', 'Inject stylesheet URLs'],
  ['--timeout', 'Request timeout'],
  ['--ttl', 'Cache TTL'],
  ['--viewport', 'Viewport as JSON (width, height, ...)'],
  ['--waitForSelector', 'Wait until a CSS selector matches'],
  ['--waitForTimeout', 'Wait for a duration before continuing'],
  ['--waitUntil', 'auto, load, domcontentloaded, networkidle0, networkidle2']
]

const CONTENT = [
  ['--selector', 'CSS selector to scope the extraction'],
  ['--selectorAll', 'CSS selector(s) matching many nodes'],
  ['--type', 'Cast the extracted value (url, image, ...)']
]

const COLLECTION = [
  ['--selector', 'CSS selector (single node)'],
  ['--selectorAll', 'CSS selector(s) matching many nodes'],
  ['--attr', 'Attribute to read (href, src, ...)'],
  ['--type', 'Cast each value (url, image, email, ...)']
]

const ALIAS = { run: 'function' }

const content = (name, desc) => ({
  usage: `${name} <url> [options]`,
  desc,
  flags: CONTENT,
  browser: true,
  examples: [[`${name} https://example.com`, desc]]
})

const collection = (name, desc) => ({
  usage: `${name} <url> [options]`,
  desc,
  flags: COLLECTION,
  browser: true,
  examples: [[`${name} https://example.com`, desc]]
})

const PRODUCTS = {
  metadata: {
    usage: ['metadata <url> [options]', '<url> [options]'],
    desc: 'Unified metadata (title, description, image, ...); default',
    flags: [
      ['--palette', 'Also extract dominant colors from images'],
      ['--meta', 'Include metadata fields, or false to skip']
    ],
    browser: true,
    examples: [
      ['https://example.com', 'unified metadata (default)'],
      [
        'https://example.com --trace',
        'print request & response, API key masked'
      ]
    ]
  },
  logo: {
    usage: 'logo <url> [options]',
    desc: 'Brand logo of the site (--square prefers the square variant)',
    flags: [
      ['--square', 'Prefer the square logo variant'],
      ['--palette', 'Also extract dominant colors']
    ],
    browser: true,
    examples: [['logo https://github.com --square', 'square brand logo']]
  },
  markdown: content('markdown', 'Page content as Markdown'),
  html: content('html', 'Page content as HTML'),
  text: content('text', 'Page content as plain text'),
  video: {
    usage: 'video <url> [options]',
    desc: 'Primary video of the page (returns the asset object)',
    flags: [['--meta', 'Include metadata fields, or false to skip']],
    browser: true,
    examples: [['video https://example.com', 'primary video asset']]
  },
  audio: {
    usage: 'audio <url> [options]',
    desc: 'Primary audio of the page (returns the asset object)',
    flags: [['--meta', 'Include metadata fields, or false to skip']],
    browser: true,
    examples: [['audio https://example.com', 'primary audio asset']]
  },
  emails: collection('emails', 'Every email address present on the page'),
  links: collection('links', 'Every absolute link URL on the page'),
  images: collection('images', 'Every absolute image URL on the page'),
  videos: collection('videos', 'Every absolute video URL on the page'),
  audios: collection('audios', 'Every absolute audio URL on the page'),
  extract: {
    usage: 'extract <url> --data <json> [options]',
    desc: 'Custom MQL data rules',
    flags: [['--data', 'JSON data rules (e.g. --data \'{"field":{...}}\')']],
    browser: true,
    examples: [
      [
        'extract https://microlink.io --data \'{"image":{"selector":"meta[property=og:image]","attr":"content","type":"image"}}\'',
        'extract og:image via MQL'
      ]
    ]
  },
  screenshot: {
    usage: 'screenshot <url> [options]',
    desc: 'Take a screenshot (returns the asset object)',
    flags: [
      ['--fullPage', 'Capture the full scrollable page'],
      ['--type', 'Image format: png, jpeg'],
      ['--element', 'CSS selector of the element to capture'],
      ['--omitBackground', 'Transparent background (png)'],
      ['--optimizeForSpeed', 'Faster encode, larger file'],
      ['--overlay', 'Browser chrome overlay as JSON'],
      ['--codeScheme', 'Syntax theme for code pages'],
      ['--animated', 'Animated screenshot (GIF/MP4)'],
      ['--palette', 'Also extract dominant colors'],
      ['--quality', 'JPEG quality (0–100)']
    ],
    browser: true,
    examples: [
      ['screenshot https://example.com --fullPage', 'full-page screenshot']
    ]
  },
  pdf: {
    usage: 'pdf <url> [options]',
    desc: 'Generate a PDF (returns the asset object)',
    flags: [
      ['--format', 'Page format: Letter, Legal, A4, ...'],
      ['--margin', "Margin (e.g. '0.5cm' or JSON)"],
      ['--scale', 'Scale (0.1–2)'],
      ['--landscape', 'Landscape orientation'],
      ['--pageRanges', "Pages to print (e.g. '1-3')"],
      ['--width', 'Page width'],
      ['--height', 'Page height'],
      ['--printBackground', 'Print background graphics']
    ],
    browser: true,
    examples: [['pdf https://example.com --format A4', 'A4 PDF']]
  },
  embed: {
    usage: 'embed <url> [options]',
    desc: 'oEmbed-style embeddable iframe ({ html, scripts })',
    flags: [
      ['--maxWidth', 'Maximum iframe width'],
      ['--maxHeight', 'Maximum iframe height']
    ],
    browser: true,
    examples: [['embed https://example.com', 'embeddable iframe']]
  },
  technologies: {
    usage: 'technologies <url> [options]',
    desc: 'Detect the tech stack behind the site',
    flags: [],
    browser: true,
    examples: [['technologies https://example.com', 'detect the tech stack']]
  },
  lighthouse: {
    usage: 'lighthouse <url> [options]',
    desc: 'Run a Lighthouse report',
    flags: [
      ['--onlyCategories', 'Limit to these categories'],
      ['--onlyAudits', 'Limit to these audits'],
      ['--skipAudits', 'Skip these audits'],
      ['--output', 'Report format: json, html, csv']
    ],
    browser: true,
    examples: [['lighthouse https://example.com', 'run a Lighthouse report']]
  },
  search: {
    usage: 'search <query> [options]',
    desc: 'Google as structured data (query instead of url)',
    flags: [
      [
        '--type',
        'news, images, videos, places, maps, shopping, scholar, patents, autocomplete'
      ],
      ['--limit', 'Maximum number of results'],
      ['--location', 'Country or locale (e.g. es)'],
      ['--period', 'Recency: hour, day, week, month, year'],
      ['--timeout', 'Request timeout']
    ],
    cli: CLI_NO_TRACE,
    examples: [
      [
        'search "best coffee" --limit 10 --location es',
        'Google results in Spain, limit 10'
      ],
      [
        'search "open source llm" --type news --period week',
        'news results from the past week'
      ]
    ]
  },
  function: {
    usage: 'function <url> --file <path> [options]',
    desc: 'Run code remotely with browser access',
    flags: [['--file', 'Path to the code file']],
    browser: true,
    cli: CLI_NO_TRACE,
    note: 'Extra flags are injected as variables in the function scope.',
    examples: [
      [
        'function https://example.com --file ./fn.js',
        'run ./fn.js with browser access'
      ]
    ]
  }
}

const productList = Object.entries(PRODUCTS)
  .map(([name, product]) => col(name, product.desc))
  .join('\n')

const global = `Usage
${cmd('<url> [options]')}
${cmd('<product> <url|query> [options]')}

Products
${productList}

Options
${rows(CLI)}

Examples
${cmd('https://example.com', 'unified metadata (default)')}
${cmd(
  'https://example.com --trace',
  'print request & response, API key masked'
)}
${cmd(
  'https://example.com --trace-full',
  'same as --trace, including the full API key'
)}
${cmd('markdown https://example.com', 'page content as Markdown')}
${cmd('screenshot https://example.com --fullPage', 'full-page screenshot')}
${cmd('logo https://github.com --square', 'square brand logo')}
${cmd('links https://example.com', 'every absolute link on the page')}
${cmd(
  'search "best coffee" --limit 10 --location es',
  'Google results in Spain, limit 10'
)}
${cmd(
  'search "open source llm" --type news --period week',
  'news results from the past week'
)}
${cmd(
  'extract https://microlink.io --data \'{"image":{"selector":"meta[property=og:image]","attr":"content","type":"image"}}\'',
  'extract og:image via MQL'
)}
${cmd(
  'function https://example.com --file ./fn.js',
  'run ./fn.js with browser access'
)}
`

const render = (name, product) => {
  const usage = []
    .concat(product.usage)
    .map(line => cmd(line))
    .join('\n')
  const cli = product.cli ?? CLI
  const options = [...product.flags, ...cli]
  const parts = [
    'Usage',
    usage,
    '',
    gray(product.desc),
    '',
    'Options',
    rows(options)
  ]
  if (product.browser) parts.push('', 'Browser', rows(BROWSER))
  if (product.note) parts.push('', gray(product.note))
  if (product.examples) {
    parts.push(
      '',
      'Examples',
      ...product.examples.map(([rest, comment]) => cmd(rest, comment))
    )
  }
  return parts.join('\n') + '\n'
}

module.exports = command => {
  const name = ALIAS[command] ?? command
  return PRODUCTS[name] ? render(name, PRODUCTS[name]) : global
}
