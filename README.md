# microlink.io

> The [Microlink API](https://microlink.io) organized into products, each returning a direct result.

Turning a page into markdown, taking a screenshot, or getting every link on a page shouldn't require hand-writing query parameters. This package organizes the Microlink API into products — from Node or the CLI:

```mjs
import createClient from 'microlink.io'

const microlink = createClient()

const markdown = await microlink.markdown('https://example.com')
console.log(markdown) // → the page content as a Markdown string
```

```bash
npx microlink.io markdown https://example.com
```

## Install

```bash
npm install microlink.io
```

That also installs the `microlink` binary. Run it without installing anything via `npx microlink.io`, or install globally with `npm install -g microlink.io`. See [CLI](#cli) for every product as a subcommand.

## Usage

The export is a single factory. Call it once to get a client; the optional argument carries `apiKey` and any other client-wide defaults:

```mjs
import createClient from 'microlink.io'

const microlink = createClient() // free client
const microlinkPro = createClient({ apiKey: process.env.MICROLINK_API_KEY }) // pro client
```

Whatever you pass to the factory is merged into every call, and per-call options can override it.

### Passing options

Every product method takes a single options object: `product(url, options)`. The library routes each key to the right destination automatically:

- `headers` travels as real HTTP request headers (never in the URL). The API forwards any `x-api-header-<name>` header to the target fetch as `<name>` — the right way to pass secrets like cookies.
- Well-known capability keys nest under the product (for example `fullPage` for `screenshot`, `format` for `pdf`, `selector` for `markdown`).
- Everything else goes as a top-level API query parameter (`device`, `waitUntil`, `prerender`, `ttl`, `proxy`, ...).

```mjs
await microlink.screenshot('https://example.com', {
  fullPage: true, // nests under `screenshot`
  device: 'iPhone 11' // top-level query param
})
```

## Products

Every [microlink.io](https://microlink.io) product maps to a client method:

| Product | Method |
|---|---|
| Link preview / Metadata | `metadata(url)` |
| Markdown / HTML / Text | `markdown(url)` / `html(url)` / `text(url)` |
| Screenshot | `screenshot(url)` |
| Animated Screenshot | `screenshot(url, { animated: true })` |
| PDF | `pdf(url)` |
| Logo | `logo(url)` |
| Embed | `embed(url)` |
| Video / Audio | `video(url)` / `audio(url)` |
| Lighthouse | `lighthouse(url)` |
| Technologies | `technologies(url)` |
| Search | `search(query)` |
| Function | `run(url, code)` (alias `function`) |

Plus library extras: `links` / `images` / `videos` / `audios` / `emails` collections and `extract` for custom data rules.

### metadata(url, options)

The unified metadata object (title, description, image, publisher, ...):

```mjs
const { title, description } = await microlink.metadata('https://vercel.com')
console.log(title, description)
```

### markdown(url, options) / html(url, options) / text(url, options)

The page content as Markdown, HTML or plain text. Use `selector` to scope it:

```mjs
const markdown = await microlink.markdown('https://example.com', { selector: 'article' })
console.log(markdown)
```

### screenshot(url, options)

Takes a screenshot and returns the asset object (`url`, `type`, `width`, `height`, `size`, ...):

```mjs
const { url } = await microlink.screenshot('https://example.com', { fullPage: true })
console.log(url)
```

### pdf(url, options)

Generates a PDF and returns the asset object:

```mjs
const { url } = await microlink.pdf('https://example.com', { format: 'A4' })
console.log(url)
```

### logo(url, options)

The brand logo of the site. Pass `square: true` to prefer the square variant:

```mjs
const { url } = await microlink.logo('https://github.com', { square: true })
console.log(url)
```

### embed(url, options)

The oEmbed-style embeddable iframe (`{ html, scripts }`), e.g. for a YouTube video or a Tweet. Constrain with `maxWidth`/`maxHeight`:

```mjs
const { html } = await microlink.embed('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
console.log(html)
```

### video(url, options) / audio(url, options)

The primary video or audio of the page (e.g. the video of a Vimeo page or a Tweet), detected by the API and returned as the asset object:

```mjs
const { url } = await microlink.video('https://vimeo.com/76979871')
console.log(url) // → direct .mp4 URL
```

### links / images / videos / audios — (url, options)

Every media URL on the page as a clean `string[]` — absolute, junk-filtered and deduped. Scope with `selectorAll`:

```mjs
const links = await microlink.links('https://example.com', { selectorAll: 'nav a' })
console.log(links) // → ['https://example.com/docs', ...]
```

### emails(url, options)

Every email address present on the page — from `mailto:` links and plain text alike. It's a preset over the API's `email` rule type, which extracts and validates addresses server-side:

```mjs
const emails = await microlink.emails('https://microlink.io')
console.log(emails) // → ['hello@microlink.io']
```

### extract(url, rules, options)

Custom data rules with full [MQL rule grammar](https://microlink.io/docs/mql/getting-started/overview) parity — the same `data` rules object you'd write for raw MQL, with the result unwrapped:

```mjs
const { image } = await microlink.extract('https://microlink.io', {
  image: { selector: 'meta[property="og:image"]', attr: 'content', type: 'image' }
})
console.log(image) // → { url, type, size, size_pretty, width, height }
```

Nested and array rules work the same way — every named product above is just a preset over this engine.

### technologies(url, options) / lighthouse(url, options)

The tech stack behind a site, or a full Lighthouse report:

```mjs
const technologies = await microlink.technologies('https://microlink.io')
console.log(technologies) // → [{ name: 'Cloudflare', ... }]
```

### search(query, options)

Google as structured data (via [@microlink/google](https://github.com/microlinkhq/google)) — built for agents, RAG pipelines, and anything that needs fresh Google results without parsing SERP HTML. Requires an `apiKey`. [Google search operators](https://ahrefs.com/blog/google-advanced-search-operators/) (`site:`, `filetype:`, quotes, ...) work as-is:

```mjs
const page = await microlink.search('Lotus Elise S2')
console.log(page.results)
// → [{ title: 'Lotus Elise - Wikipedia', url, description }, ...]
console.log(page.knowledgeGraph) // entity card, when Google shows one
console.log(page.peopleAlsoAsk) // related questions
console.log(page.relatedSearches) // query expansion ideas
```

`type` routes the query to any of the 10 Google verticals, each returning fields normalized for that surface:

| `type` | Returns |
|---|---|
| `search` (default) | web results + knowledge graph, related questions/searches |
| `news` | articles with `publisher`, `date`, thumbnail |
| `images` | full-resolution image URLs with dimensions |
| `videos` | video metadata with duration |
| `places` / `maps` | local entities with address, phone, coordinates, ratings, hours |
| `shopping` | products with parsed `price` and ratings |
| `scholar` | papers with citation counts and PDF links |
| `patents` | filings with ISO 8601 dates |
| `autocomplete` | query suggestions |

```mjs
const news = await microlink.search('open source llm', { type: 'news', period: 'week' })
console.log(news.results[0])
// → { title: 'DeepSeek open sources DSpark...', publisher: 'VentureBeat', date: '2026-06-30T...' }

const shopping = await microlink.search('macbook pro', { type: 'shopping' })
console.log(shopping.results[0].price) // → { symbol: '$', amount: 1999 }

const autocomplete = await microlink.search('how to fine tune', { type: 'autocomplete' })
console.log(autocomplete.results.map(r => r.value)) // → ['how to fine tune llm', ...]
```

`location` (ISO 3166-1 country code) localizes ranking and language; `period` (`hour`/`day`/`week`/`month`/`year`) constrains freshness; `limit` caps results per page; `page` selects which page to fetch (1 default):

```mjs
await microlink.search('recetas de pasta', { location: 'es', limit: 10 })
await microlink.search('node.js frameworks', { page: 2 })
```

Results compose in depth: every result with a `url` exposes lazy `.html()` and `.markdown()` for fetching the full page content only when needed — the source-expansion pattern for RAG:

```mjs
const page = await microlink.search('site:openai.com function calling guide')
await Promise.all(
  page.results.slice(0, 3).map(async result => ({
    title: result.title,
    url: result.url,
    markdown: await result.markdown()
  }))
)
```

The page itself serializes too: `page.html()` and `page.markdown()` return the whole Google results page as HTML or Markdown — useful for feeding a SERP straight to an LLM or building your own parser on top:

```mjs
const page = await microlink.search('Lotus Elise S2')
const markdown = await page.markdown() // the SERP as Markdown
const html = await page.html() // the SERP as HTML
```

Pages chain with `.next()`, or jump ahead with `{ page: 2 }`:

```mjs
let page = await microlink.search('node.js frameworks')
while (page) {
  for (const result of page.results) console.log(result.title)
  page = await page.next()
}
```

### run(url, code, options)

Run any JavaScript remotely in a sandboxed runtime — no Lambda bundle, no browser fleet, no server ([guide](https://microlink.io/docs/guides/function)). Also exposed as `function`, matching the API parameter name. You write a plain function; the library handles serialization, compression and the API call for you. When the code doesn't reference `page`, no browser is started, making execution faster and cheaper:

```mjs
const { value } = await microlink.run('https://example.com', () => 40 + 2)
console.log(value) // → 42
```

When it references `page`, Microlink starts a headless browser and navigates to the URL first, handing your code the full [puppeteer `page`](https://pptr.dev/api/puppeteer.page) for clicks, waits, evaluation and navigation ([browser interaction](https://microlink.io/docs/guides/function/browser-interaction)):

```mjs
const { value } = await microlink.run('https://example.com', async ({ page }) => {
  await page.waitForSelector('h1')
  return page.$eval('h1', el => el.textContent)
})
console.log(value) // → 'Example Domain'
```

Any extra option you pass is forwarded into the function scope — the simplest way to make one function reusable across requests ([custom parameters](https://microlink.io/docs/guides/function/writing-functions)):

```mjs
const { value } = await microlink.run(
  'https://example.com',
  ({ page, selector }) => page.$eval(selector, el => el.textContent),
  { selector: 'h1' }
)
console.log(value)
```

You can `require()` any npm package inside the function — dependencies are detected, installed on the fly into the sandbox, and cached for subsequent runs. Pin a version with `require('cheerio@1.0.0')`:

```mjs
const { value } = await microlink.run('https://news.ycombinator.com', async ({ page }) => {
  const cheerio = require('cheerio')
  const $ = cheerio.load(await page.content())
  return $('.titleline > a').map((i, el) => $(el).text()).toArray()
})
console.log(value) // → ['Top HN story', ...]
```

The result carries more than the return value — `console.log` calls are captured in `logging`, and `profiling` reports peak cpu/memory plus per-phase timings (`install`/`build`/`spawn`/`run`) so you can spot the bottleneck ([profiling](https://microlink.io/docs/guides/function/profiling-and-performance)):

```mjs
const { isFulfilled, value, logging, profiling } = await microlink.run('https://example.com', ({ page }) => {
  console.log('visiting page')
  return page.title()
})
console.log(isFulfilled) // → true
console.log(value) // → 'Example Domain'
console.log(logging.log) // → [['visiting page']]
console.log(profiling.phases) // → { install: 0, build: 7.8, spawn: 68.5, run: 0.02, total: 73.7 }
```

When the code throws, the promise still resolves: `isFulfilled` is `false` and `value` carries the error as `{ name, message }`. Resource limits surface the same way with plan-aware errors (`TimeoutError`, `MemoryError`, `CodeSizeError`, ...) — see [troubleshooting](https://microlink.io/docs/guides/function/troubleshooting). From the CLI, put the code in a file and pass extra scope variables as flags: `npx microlink.io function https://example.com --file ./fn.js --selector h1`.

## Authenticated requests

Secrets stay out of URLs: `apiKey` is sent as the `x-api-key` header, and `headers` travel as real request headers:

```mjs
import createClient from 'microlink.io'

const microlink = createClient({ apiKey: process.env.MICROLINK_API_KEY })

console.log(await microlink.markdown('https://x.com/some/article', {
  headers: { 'x-api-header-cookie': 'auth_token=...' } // forwarded to the target as `cookie`
}))
```

## Error handling

Any API error rejects with a `MicrolinkError` carrying `code`, `statusCode` and a human-readable `description`:

```mjs
import createClient, { MicrolinkError } from 'microlink.io'

const microlink = createClient()

try {
  await microlink.screenshot('https://example.com')
} catch (error) {
  if (error instanceof MicrolinkError) console.error(error.code, error.description)
}
```

## CLI

Every product is a `microlink` subcommand — `npx microlink.io` works without a global install. Run `microlink login` to save an API key from your account.

```bash
npx microlink.io login
npx microlink.io markdown https://example.com
npx microlink.io screenshot https://example.com --fullPage
npx microlink.io logo https://github.com --square
npx microlink.io links https://example.com
npx microlink.io search "best coffee" --limit 10 --location es
npx microlink.io extract https://microlink.io --data '{"image":{"selector":"meta[property=og:image]","attr":"content","type":"image"}}'
npx microlink.io function https://example.com --file ./fn.js
```

## Related

- [@microlink/mql](https://github.com/microlinkhq/mql) — the low-level Microlink Query Language client (raw envelopes, `buffer`/`stream` access).
- [@microlink/google](https://github.com/microlinkhq/google) — structured Google data, powering `search`.
- [@microlink/function](https://github.com/microlinkhq/function) — remote JavaScript functions, powering `function`/`run` ([guides](https://microlink.io/docs/guides/function)).

## License

**microlink.io** © [microlink.io](https://microlink.io), released under the [MIT](https://github.com/microlinkhq/microlink/blob/master/LICENSE.md) License.

> [microlink.io](https://microlink.io) · GitHub [microlinkhq](https://github.com/microlinkhq) · X [@microlinkhq](https://x.com/microlinkhq)
