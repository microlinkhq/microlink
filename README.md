# microlink.io

> The [Microlink API](https://microlink.io) organized into products, each returning a direct result.

Turning a page into markdown, taking a screenshot, or getting every link on a page shouldn't require hand-writing query parameters. This library organizes the Microlink API into products — the way Stripe organizes a powerful API into `stripe.customers.create()`:

```js
const microlink = require('microlink.io')()

microlink.markdown('https://example.com').then(markdown => {
  console.log(markdown) // → the page content as a Markdown string
})
```

It's a thin layer over [@microlink/mql](https://github.com/microlinkhq/mql): HTTP, auth, retries, errors and binary handling are already solved there. Each product just sets the right API parameters and unwraps the result.

## Install

```bash
npm install microlink.io
```

## Usage

The export is a single factory. Call it once to get a client; the optional argument carries `apiKey` and any other client-wide defaults:

```js
const createClient = require('microlink.io')

const microlink = createClient() // free client
const microlinkPro = createClient({ apiKey: process.env.MICROLINK_API_KEY }) // pro client
```

ESM works the same way:

```js
import createClient from 'microlink.io'

const microlink = createClient()
```

Whatever you pass to the factory is merged into every call, and per-call options can override it.

### Passing options

Every product method takes a single options object: `product(url, options)`. The library routes each key to the right destination automatically:

- `headers` travels as real HTTP request headers (never in the URL). The API forwards any `x-api-header-<name>` header to the target fetch as `<name>` — the right way to pass secrets like cookies.
- Well-known capability keys nest under the product (for example `fullPage` for `screenshot`, `format` for `pdf`, `selector` for `markdown`).
- Everything else goes as a top-level API query parameter (`device`, `waitUntil`, `prerender`, `ttl`, `proxy`, ...).

```js
const microlink = require('microlink.io')()

microlink.screenshot('https://example.com', {
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
| Function | `function(url, code)` / `run(url, code)` |

Plus library extras: `links` / `images` / `videos` / `audios` collections and `extract` for custom data rules.

### metadata(url, options)

The unified metadata object (title, description, image, publisher, ...):

```js
microlink.metadata('https://vercel.com').then(({ title, description }) => {
  console.log(title, description)
})
```

### markdown(url, options) / html(url, options) / text(url, options)

The page content as Markdown, HTML or plain text. Use `selector` to scope it:

```js
microlink.markdown('https://example.com', { selector: 'article' }).then(markdown => {
  console.log(markdown)
})
```

### screenshot(url, options)

Takes a screenshot and returns the asset object (`url`, `type`, `width`, `height`, `size`, ...):

```js
microlink.screenshot('https://example.com', { fullPage: true }).then(({ url }) => {
  console.log(url)
})
```

### pdf(url, options)

Generates a PDF and returns the asset object:

```js
microlink.pdf('https://example.com', { format: 'A4' }).then(({ url }) => {
  console.log(url)
})
```

### logo(url, options)

The brand logo of the site. Pass `square: true` to prefer the square variant:

```js
microlink.logo('https://github.com', { square: true }).then(({ url }) => {
  console.log(url)
})
```

### embed(url, options)

The oEmbed-style embeddable iframe (`{ html, scripts }`), e.g. for a YouTube video or a Tweet. Constrain with `maxWidth`/`maxHeight`:

```js
microlink.embed('https://www.youtube.com/watch?v=dQw4w9WgXcQ').then(({ html }) => {
  console.log(html)
})
```

### video(url, options) / audio(url, options)

The primary video or audio of the page (e.g. the video of a Vimeo page or a Tweet), detected by the API and returned as the asset object:

```js
microlink.video('https://vimeo.com/76979871').then(({ url, type }) => {
  console.log(url) // → direct .mp4 URL
})
```

### links / images / videos / audios — (url, options)

Every media URL on the page as a clean `string[]` — absolute, junk-filtered and deduped. Scope with `selectorAll`:

```js
microlink.links('https://example.com', { selectorAll: 'nav a' }).then(links => {
  console.log(links) // → ['https://example.com/docs', ...]
})
```

### extract(url, rules, options)

Custom data rules with full [MQL rule grammar](https://microlink.io/docs/mql/getting-started/overview) parity — the same `data` rules object you'd write for raw MQL, with the result unwrapped:

```js
microlink.extract('https://microlink.io', {
  image: { selector: 'meta[property="og:image"]', attr: 'content', type: 'image' }
}).then(({ image }) => {
  console.log(image) // → { url, type, size, size_pretty, width, height }
})
```

Nested and array rules work the same way — every named product above is just a preset over this engine.

### technologies(url, options) / lighthouse(url, options)

The tech stack behind a site, or a full Lighthouse report:

```js
microlink.technologies('https://microlink.io').then(technologies => {
  console.log(technologies) // → [{ name: 'Cloudflare', ... }]
})
```

### search(query, options)

Structured Google search results (via [@microlink/google](https://github.com/microlinkhq/google)), with pagination and per-result content helpers:

```js
microlink.search('best coffee', { limit: 10, location: 'es' }).then(page => {
  console.log(page.results)
  return page.next() // → next page
})
```

### function(url, code, options)

Run a browser function against the page (via [@microlink/function](https://github.com/microlinkhq/function)). `run` is a friendlier alias:

```js
microlink.run('https://example.com', ({ page }) => page.title()).then(result => {
  console.log(result.value) // → 'Example Domain'
})
```

## Authenticated requests

Secrets stay out of URLs: `apiKey` is sent as the `x-api-key` header, and `headers` travel as real request headers:

```js
const microlink = require('microlink.io')({ apiKey: process.env.MICROLINK_API_KEY })

microlink.markdown('https://x.com/some/article', {
  headers: { 'x-api-header-cookie': 'auth_token=...' } // forwarded to the target as `cookie`
}).then(console.log)
```

## Error handling

Any API error rejects with a `MicrolinkError` carrying `code`, `statusCode` and a human-readable `description`:

```js
const { MicrolinkError } = require('microlink.io')

microlink.screenshot('https://example.com').catch(error => {
  if (error instanceof MicrolinkError) console.error(error.code, error.description)
})
```

## CLI

The package ships a `microlink` binary where every product is a subcommand:

```bash
microlink markdown https://example.com
microlink screenshot https://example.com --fullPage
microlink logo https://github.com --square
microlink links https://example.com
microlink search "best coffee" --limit 10 --location es
microlink extract https://microlink.io --data '{"image":{"selector":"meta[property=og:image]","attr":"content","type":"image"}}'
microlink function https://example.com --file ./fn.js
```

Flags map to the same single options bag as the library. Use `--api-key` (or the `MICROLINK_API_KEY` environment variable) for authenticated calls and repeatable `--header 'Name: value'` flags for request headers. Strings print raw to stdout; objects pretty-print as JSON.

## Related

- [@microlink/mql](https://github.com/microlinkhq/mql) — the low-level Microlink Query Language client (raw envelopes, `buffer`/`stream` access).
- [@microlink/google](https://github.com/microlinkhq/google) — structured Google data, powering `search`.
- [@microlink/function](https://github.com/microlinkhq/function) — browser functions, powering `function`/`run`.

## License

**microlink.io** © [microlink.io](https://microlink.io), released under the [MIT](https://github.com/microlinkhq/microlink/blob/master/LICENSE.md) License.

> [microlink.io](https://microlink.io) · GitHub [microlinkhq](https://github.com/microlinkhq) · X [@microlinkhq](https://x.com/microlinkhq)
