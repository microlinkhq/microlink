# Ship the `microlink` library — Stripe-style products over the API

## Context

The Microlink API is powerful (screenshot, PDF, metadata, content extraction, link/image/media
collections, Lighthouse, tech detection, browser functions, Google search), but the recommended
entry point — `@microlink/mql`
— is too low-level. Turning a page into markdown today means hand-writing a `data` selector and
remembering to set `meta: false`. Specialized capabilities got scattered into separate packages
(`@microlink/function`, `@microlink/google`).

The goal: one `microlink` library that organizes the API into **products**, each returning a
**direct result**, the way Stripe organizes a powerful API into `stripe.customers.create()`.

```js
const microlink = require('microlink')()                              // free client

const markdown = await microlink.markdown('https://example.com')      // string
const shot = await microlink.screenshot('https://example.com')        // { url, type, width, ... }
```

This is a thin product layer. It does **not** reinvent HTTP, auth, retries, errors, or binary
handling — `@microlink/mql` already does all of that. Each product method just sets the right API
params and unwraps the `{ status, data }` envelope, exactly like `@microlink/function` returns
`data.function` (`function/src/index.js:33`) and `@microlink/google` returns `data` (`google/src/index.js`).

## Design

### Config pattern — one factory, always invoked

The export is a **single factory**. You always call it once to get a client; the optional argument
carries `apiKey` and any other client-wide settings. No dual-nature export, no `microlink.markdown`
without invoking — one unified way:

```js
const microlink = require('microlink')()                          // free client
const microlink = require('microlink')({ apiKey })                // pro client
const microlink = require('microlink')({ apiKey, endpoint, headers, ttl }) // any client-wide default

await microlink.markdown(url)
await microlink.screenshot(url, { fullPage: true })
```

Whatever you pass to the factory becomes the **client context** (`ctx`) merged into every call, so
per-call options can still override it. Implementation (`src/index.js`):

```js
const create = (ctx = {}) => {
  const route = (opts, nested = []) => { /* see "Passing options" */ }
  return {
    metadata, logo, markdown, html, text,
    links, images, videos, audios, extract,
    screenshot, pdf, technologies, lighthouse, search,
    function: fn, run: fn
  }
}
module.exports = create   // require('microlink')(ctx) → client
```

Key constraint discovered in `mql/src/index.js:154-182`: `mql.extend(defaultOpts)` merges into the
**3rd** arg (`gotOpts`), but `apiKey`/`endpoint` are read from the **2nd** arg in `getApiUrl`
(`mql/src/index.js:156`). So context (`apiKey`, `endpoint`) must be merged into the per-call options
object, not via `mql.extend`. This is the same approach `@microlink/google` uses:
`mql(url, { ...ctx, ...opts })` (`google/src/index.js`). Each product does
`mql(url, { ...ctx, ...productDefaults, ...userOpts })`.

### Passing options — one bag: `(target, options)`

Every product method takes a **single options object** (no 2nd/3rd-arg split, no `undefined`
placeholder):

```js
product(target, options?)
```

The library routes the keys of that one object to the three destinations mql actually has
(`mql(url, mqlOpts, gotOpts)`, `mql/src/index.js:154-173`):

1. **`headers` → mql's HTTP layer (`gotOpts`, 3rd arg).** This is mandatory for secrets: `apiKey`
   becomes the `x-api-key` header and every other `mqlOpts` key is `flatten()`-ed into the URL query
   string, but `gotOpts.headers` are real request headers. So `x-api-header-cookie` travels as a
   header, never as a `headers.*` query param — it never lands in URLs/logs. The API forwards any
   `x-api-header-<name>` header to the target fetch as `<name>`.
2. **Capability sub-options → nested under the capability key.** Each capability product owns a
   small, stable allow-list of nested keys; matching keys nest, the rest fall through to (3):
   - `screenshot`: `fullPage`, `type`, `overlay`, `element`, `omitBackground`, `optimizeForSpeed`,
     `codeScheme`, `animated`, `palette` → `screenshot: { ... }`
   - `pdf`: `format`, `margin`, `scale`, `landscape`, `pageRanges`, `width`, `height`,
     `printBackground` → `pdf: { ... }`
   - `markdown`/`html`/`text`: `selector`, `selectorAll`, `type` → `data: { <name>: { attr, ... } }`
   - `lighthouse`/`technologies`: Lighthouse/Wappalyzer config → `insights: { ... }`
   - `search`: `limit`, `location`, `type`, `period` → handled inside `@microlink/google`
3. **Everything else → top-level mql query params (`mqlOpts`, 2nd arg).** This is the API's finite,
   known top-level set (`apiKey`, `endpoint`, `cacheKey`, `ttl`, `staleTtl`, `force`, `retry`,
   `timeout`, `waitForTimeout`, `waitUntil`, `prerender`, `device`, `viewport`, `colorScheme`,
   `proxy`, `adblock`, `javascript`, `animations`, `filename`, `iframe`, `video`, `audio`, `meta`,
   `click`, `scripts`, `styles`, `modules`) — verified against `api/src/constant.js` `DEFAULT_QUERY_TYPES`.

Routing the small per-capability nested allow-list (rather than enumerating the larger top-level
set) keeps it robust: an unknown key safely defaults to top-level (the common bucket for transport),
and only well-known capability knobs nest. One helper centralizes it; `nested` is the per-product
key set:

```js
const HTTP = ['headers']

const create = (ctx = {}) => {
  const route = (opts, nested = []) => {
    const merged = { ...ctx, ...opts }
    const got = {}; const top = {}; const sub = {}
    for (const [k, v] of Object.entries(merged)) {
      if (HTTP.includes(k)) got.headers = v
      else if (nested.includes(k)) sub[k] = v
      else top[k] = v
    }
    return { top, sub, got: got.headers ? got : undefined }
  }
  return { /* products call route() then mql() */ }
}
```

Common cases stay one-liners, all through the single bag:

```js
const microlink = require('microlink')()
await microlink.screenshot(url, { fullPage: true })                  // fullPage nests
await microlink.screenshot(url, { fullPage: true, device: 'iPhone 11' }) // device top-level
await microlink.markdown(url, { selector: 'article' })
await require('microlink')({ apiKey }).pdf(url, { format: 'A4' })    // auth via factory
```

Worked example — authenticated X article to markdown (secret cookie stays out of the URL):

```js
const microlink = require('microlink')({ apiKey: process.env.MICROLINK_API_KEY })

const markdown = await microlink.markdown(
  'https://x.com/eliana_jordan/article/2064997219648913457',
  {
    cacheKey: 'uros',
    // microlink turns x-api-header-* into target HTTP headers for you
    headers: { 'x-api-header-cookie': `auth_token=${X_AUTH_TOKEN}; ct0=${X_CT0}` }
  }
)
// routes to → mql(url,
//   { apiKey, cacheKey: 'uros', meta: false, data: { markdown: { attr: 'markdown' } } },
//   { headers: { 'x-api-header-cookie': ... } })   // identical to the hand-written mql call
```

### Products (v1)

Each calls `mql` and returns the unwrapped result. `meta: false` is set on every non-metadata
product so the response carries only the requested field.

Every product runs its single `options` bag through `route(options, nested)` (which threads `ctx`,
extracts `headers` to the HTTP layer, nests capability keys, and sends the rest as top-level query
params), then calls `mql(url, mqlOpts, got)` and unwraps the field. The table shows each product's
`nested` key set and the assembled `mqlOpts`.

| Method | `nested` keys | assembled `mqlOpts` | Returns |
|---|---|---|---|
| `metadata(url, options)` | — | `{ ...top }` (meta default true) | unified metadata object (`data`) |
| `logo(url, options)` | `square` | `meta: sub.square ? { logo: { square } } : true, ...top` | `{ url, type, width, height, size, ... }` (`data.logo`) |
| `markdown(url, options)` | `selector,selectorAll,type` | `meta:false, data:{markdown:{attr:'markdown', ...sub}}, ...top` | `string` (`data.markdown`) |
| `html(url, options)` | `selector,selectorAll,type` | `meta:false, data:{html:{attr:'html', ...sub}}, ...top` | `string` (`data.html`) |
| `text(url, options)` | `selector,selectorAll,type` | `meta:false, data:{text:{attr:'text', ...sub}}, ...top` | `string` (`data.text`) |
| `screenshot(url, options)` | screenshot knobs | `meta:false, screenshot: sub or true, ...top` | `{ url, type, width, height, size, ... }` |
| `pdf(url, options)` | pdf knobs | `meta:false, pdf: sub or true, ...top` | `{ url, type, size, ... }` |
| `embed(url, options)` | `maxWidth,maxHeight` | `meta:false, iframe: sub or true, ...top` | `{ html, scripts }` (`data.iframe`) |
| `technologies(url, options)` | insights config | `meta:false, insights:{technologies:true, lighthouse:false, ...sub}, ...top` | `array` (`data.insights.technologies`) |
| `lighthouse(url, options)` | insights config | `meta:false, insights:{lighthouse:true, technologies:false, ...sub}, ...top` | lighthouse report |
| `search(query, options)` | — | wraps `@microlink/google` `createGoogleClient(ctx)(query, options)` | paginated results w/ `.next()`, per-result `.html()`/`.markdown()` |
| `function(url, code, options)` (alias `run`) | — | wraps `@microlink/function` `fn(code, ctx, got)(url, top)` | `data.function` (`{ isFulfilled, value, profiling, logging }`) |

Reference implementation (`sub`/`top`/`got` come from `route(options, nested)`):

```js
screenshot: (url, options) => {
  const { sub, top, got } = route(options, SCREENSHOT_KEYS)
  return mql(url, { ...top, meta: false, screenshot: Object.keys(sub).length ? sub : true }, got)
    .then(r => r.data.screenshot)
}

markdown: (url, options) => {
  const { sub, top, got } = route(options, CONTENT_KEYS)
  return mql(url, { ...top, meta: false, data: { markdown: { attr: 'markdown', ...sub } } }, got)
    .then(r => r.data.markdown)
}
```

Note: the data-selector output field is named after the product (`data.markdown`, `data.html`,
`data.text`) — matching how the field key is chosen in raw mql (`data: { markdown: { attr: 'markdown' } }`).

Notes:
- `markdown` is the headline example from the brief; it ships even though it wasn't in the explicit
  product list. It shares one content helper with `html`/`text` (one impl, three `attr` values).
- Binary products (`screenshot`, `pdf`) return the **rich object** per decision — the `url`,
  `type`, dimensions, and `size`. (`mql.buffer`/`stream` remain reachable via raw `mql` for anyone
  who wants bytes; not exposed in v1 product methods.)
- `logo` is the brand logo metadata field (icon/apple-touch-icon/manifest derived). It returns the
  same rich object shape as `image`/`screenshot`; `logo(url, { square: true })` prefers the square
  variant (`meta.logo.square`). It's a focused slice of `metadata()` — `metadata(url)` also carries
  `logo`, but `logo(url)` is the direct one-field call.
- `embed` returns the oEmbed-style embeddable iframe: `{ html, scripts }` (the markup to drop in a
  page + the `<script>` URLs it needs, e.g. a YouTube/Tweet/CodePen embed). It uses the `iframe`
  param, which runs independently of `meta` (`api/src/extract/meta/index.js:202` adds the iframe
  rules even when `meta:false`), so `embed(url)` fetches just the embed. `embed(url, { maxWidth, maxHeight })`
  constrains the embed size (`iframe.maxWidth`/`maxHeight`).
- `insights` is split into two products — `technologies` and `lighthouse` — each disabling the
  other half so the call is cheap and the result is the bare field.
- `function` is a legal JS property name; `run` is provided as a friendlier alias. For `function`,
  `route()` still extracts `headers`→`got` and the rest→`top`, then calls
  `fn(code, { ...ctx, ...top }, got)(url)` (`@microlink/function` accepts `fn(code, mqlOpts, gotOpts)`,
  `function/src/index.js:18`). `search` passes the single bag straight to `@microlink/google`, which
  splits query opts (`limit`/`location`/`type`/`period`) from passthrough mql opts internally
  (`google/src/index.js`) — see the headers limitation in follow-ups.

### Collection products (data selectors)

"Get all the X from a page" maps directly to the `data` selector with `selectorAll` + `attr`. The
API already does the heavy lifting: results come back **absolute** (relative URLs resolved against
the page), **junk-filtered** (`null`/`false`/`undefined` string values dropped), and **deduped** —
verified in `api/test/unit/extract/meta/data/selector-all.js:56-139`. So each collection method
returns a clean `string[]`.

Shared factory:

```js
const COLLECTION_KEYS = ['selector', 'selectorAll', 'attr', 'type'] // user overrides

const collection = (field, selectorAll, attr, type) => (url, options) => {
  const { sub, top, got } = route(options, COLLECTION_KEYS)
  const rule = { selectorAll, attr, type, ...sub } // sub can override selectorAll/attr
  return mql(url, { ...top, meta: false, data: { [field]: rule } }, got)
    .then(r => r.data[field])
}
```

| Method | rule | Returns |
|---|---|---|
| `links(url, options)` | `{ selectorAll: 'a', attr: 'href', type: 'url' }` | `string[]` of absolute link URLs |
| `images(url, options)` | `{ selectorAll: 'img', attr: 'src', type: 'url' }` | `string[]` of absolute image URLs |
| `videos(url, options)` | `{ selectorAll: ['video[src]', 'video source[src]'], attr: 'src', type: 'url' }` | `string[]` of absolute video URLs |
| `audios(url, options)` | `{ selectorAll: ['audio[src]', 'audio source[src]'], attr: 'src', type: 'url' }` | `string[]` of absolute audio URLs |

`selectorAll` accepts an array of selectors and unions the matches (`selector-all.js:80-111`), which
is why `videos`/`audios` cover both the element's own `src` and nested `<source>` tags.

Scoping/overrides flow through the same single bag, e.g. `links(url, { selectorAll: 'nav a' })` or
`images(url, { selectorAll: 'article img' })`; `headers`/`cacheKey`/etc. route exactly as elsewhere.

These are distinct from `metadata()`, which returns the single *primary* `video`/`audio` (the
share-preview media); `videos`/`audios` return **every** media URL on the page.

**Generic escape hatch — `extract(url, rules, options)`.** For anything without a named method,
expose the raw data selector directly (returns the full `data` object of extracted fields):

```js
const microlink = require('microlink')()
const { stars } = await microlink.extract('https://github.com/microlinkhq', {
  stars: { selector: '[data-tab-item="stars"] .Counter', type: 'number' }
})
// extract → mql(url, { ...top, meta: false, data: rules }, got).then(r => r.data)
```

This keeps the library complete: named products for the common cases, `extract` for the long tail,
so users never have to drop back to raw `mql`.

### CLI

Ship a `microlink` binary (in scope per decision; overlaps `@microlink/cli` but is product-shaped).
Subcommand = product:

```bash
microlink screenshot https://example.com --fullPage
microlink markdown   https://example.com
microlink metadata   https://example.com
microlink logo       https://example.com --square
microlink embed      https://www.youtube.com/watch?v=dQw4w9WgXcQ
microlink pdf        https://example.com
microlink links      https://example.com
microlink images     https://example.com
microlink videos     https://example.com
microlink audios     https://example.com
microlink technologies https://example.com
microlink lighthouse https://example.com
microlink search     "best coffee" --limit 10 --location es
microlink function   https://example.com --file ./fn.js
```

- Parse with `mri` (already a dep). First positional = product, second = url/query. All other flags
  collapse into the **single options bag** and are routed by the same `route()` helper the library
  uses — the CLI does no bucketing of its own. So `microlink screenshot URL --fullPage --device 'iPhone 11'`
  → `options: { fullPage: true, device: 'iPhone 11' }` → `fullPage` nests, `device` top-level.
- Repeated `--header 'cookie: ...'` flags (mri collects to array) build `options.headers` (object),
  which `route()` sends to the HTTP layer — same as `@microlink/cli`.
- `apiKey` from `--api-key` or `MICROLINK_API_KEY` env (matches `@microlink/cli`).
- Output: strings (`markdown`/`html`/`text`) printed raw to stdout; objects pretty-printed with
  `jsome`. Errors print `MicrolinkError` message and exit 1.
- Replace the boilerplate `bin/index.js` (it references undefined `cwd`, reads `./help.txt` from
  cwd, and `require('microlink')` as a single function — all placeholder).

### Module format & packaging — JavaScript, dual ESM + CJS, TypeScript types

Plain JavaScript, no build/transpile step. Dual ESM + CJS from the same source, plus a hand-written
`.d.ts`. Mirror `@microlink/google` exactly — it's the same shape (a factory that returns a client),
so its CJS/ESM/types wiring (`google/src/index.js`, `src/main.mjs`, `src/index.d.ts`) is the
template.

- **CJS source** — `src/index.js` (`'use strict'`). The factory plus any named helpers:
  ```js
  const create = (ctx = {}) => ({ /* products */ })
  module.exports = create
  module.exports.MicrolinkError = require('@microlink/mql').MicrolinkError // re-export for catch()
  ```
  Usage: `const microlink = require('microlink')()`.
- **ESM entry** — `src/main.mjs` re-exports the CJS default + named (mirror `google/src/main.mjs`):
  ```js
  import create from './index.js'
  export const MicrolinkError = create.MicrolinkError
  export default create
  ```
  Usage: `import microlink from 'microlink'` then `microlink()`. Named: `import { MicrolinkError }`.
- **Types** — `src/index.d.ts`, callable-factory style (matches `google/src/index.d.ts`):
  ```ts
  interface MicrolinkClient {
    metadata(url: string, options?: Options): Promise<Metadata>
    markdown(url: string, options?: ContentOptions): Promise<string>
    screenshot(url: string, options?: ScreenshotOptions): Promise<Screenshot>
    links(url: string, options?: CollectionOptions): Promise<string[]>
    embed(url: string, options?: EmbedOptions): Promise<Embed>
    logo(url: string, options?: LogoOptions): Promise<Logo>
    search(query: string, options?: SearchOptions): Promise<SearchPage>
    function<T = unknown>(url: string, code: FunctionInput, options?: Options): Promise<FunctionResult<T>>
    run: MicrolinkClient['function']
    extract(url: string, rules: object, options?: Options): Promise<Record<string, unknown>>
    /* ...html, text, pdf, videos, audios, images, technologies, lighthouse */
  }
  interface ClientOptions { apiKey?: string; endpoint?: string; headers?: Record<string, string>; /* ...transport */ }
  interface create { (options?: ClientOptions): MicrolinkClient }
  declare const create: create
  export default create
  ```
  Reuse upstream types where possible: import `SearchPage`/etc. shapes from `@microlink/google` and
  `FunctionInput`/`FunctionResponse` from `@microlink/function` rather than redefining.
- **`bin/index.js`** — CLI entry (CJS), calls `require('../src')(ctx)[command](...)`.
- **`package.json`**:
  - `exports`: `{ "types": "./src/index.d.ts", "require": "./src/index.js", "import": "./src/main.mjs", "default": "./src/main.mjs" }` (current `"./cli/index.js"` is wrong — that path doesn't exist).
  - `type`: omit (default CJS); the `.mjs` extension + `import` condition handle ESM. Matches `@microlink/google`.
  - `bin`: keep `{ "microlink": "bin/index.js" }`.
  - `files`: ship `src` + `bin` (so `.d.ts` and `.mjs` are published).
  - `dependencies`: add `@microlink/mql`, `@microlink/function`, `@microlink/google`, `jsome`
    (CLI pretty-print), keep `mri`. Pin with `~` per repo `.npmrc` (`save-prefix=~`).
  - delete placeholder root `index.js`.

Both entry points are exercised by tests: `test/*.mjs` import the ESM build, and a `test/cjs.js`
(or an AVA case using `require`) loads `src/index.js` — asserting `require('microlink')()` and
`import microlink from 'microlink'` expose the same product methods (mirrors `mql/test/build.mjs`).

## Files to create / modify

- `src/index.js` — **new**, CJS factory + product layer over `@microlink/mql`.
- `src/main.mjs` — **new**, ESM re-export (`export default create`).
- `src/index.d.ts` — **new**, callable-factory TypeScript types.
- `bin/index.js` — **rewrite** as product-subcommand CLI.
- `bin/help.txt` — **rewrite** with real product usage.
- `package.json` — fix `exports`/`type`/`files`, add `dependencies` + `tsd`; remove dead `index.js`.
- `README.md` — **rewrite** documenting each product with one example apiece.
- `test/unit.mjs`, `test/integration.mjs`, `test/cjs.js`, `test/index.test-d.ts` — see Tests.
- delete `index.js` (placeholder).

## Tests & evals (same commit)

Two lanes, per the repo's AVA setup (`c8 ava`, `standard` lint).

- **Gate tests (deterministic, free, fast)** — `test/unit.mjs`. Stub `@microlink/mql` (inject a fake
  via a small seam, or assert on `mql.getApiUrl`) to verify each product sets the correct params and
  unwraps the correct field: `markdown` → `data.markdown`, `screenshot` → `data.screenshot`,
  `technologies` → `data.insights.technologies`, `logo` → `data.logo` (and `{ square: true }` →
  `meta.logo.square`), `embed` → `data.iframe` with `iframe:true, meta:false` (and `{ maxWidth }` →
  `iframe.maxWidth`), `links`/`images`/`videos`/`audios` → `data.<field>` with the right
  `selectorAll`/`attr`/`type` rule, `extract` returns the full `data` object, factory threads `apiKey` into the call options, `function`/`run` alias identity. No
  network. **Single-bag routing** is asserted explicitly: `screenshot(url, { fullPage: true, device: 'X' })`
  must call mql with `screenshot:{ fullPage:true }` and top-level `device:'X'`;
  `links(url, { selectorAll: 'nav a' })` overrides the default rule selector; `markdown(url, { headers:{...} })`
  forwards `headers` to mql's **3rd arg** (HTTP layer), not the query string; instance `apiKey` is
  overridable by a per-call key.
- **Periodic evals (paid-ish, real free API)** — `test/integration.mjs`. Hit
  `https://api.microlink.io` against a stable URL (e.g. `https://example.com`) and assert
  shape/threshold: `markdown` returns a non-empty string, `screenshot` returns an object with a
  `url` and positive `width`, `metadata` has a `title`, `links`/`images` return arrays of
  absolute `http(s)` URLs (and `links` is deduped). Mark with longer AVA timeout; allowed to be
  non-deterministic but must pass shape thresholds.
- CLI smoke: spawn `bin/index.js markdown https://example.com` and assert stdout is non-empty
  string; `links ...` / `screenshot ...` emit JSON (array / object with a `url`).
- **Type tests** — `test/index.test-d.ts` run with `tsd` (mirror `@microlink/mql`, which lints with
  `standard && tsd`). Assert `require('microlink')()` and `import microlink` are callable, return a
  client, and each method's return type is correct: `markdown(...)` is `Promise<string>`,
  `links(...)` is `Promise<string[]>`, `screenshot(...)` resolves to the rich object, `search('q', { type: 'news' })`
  narrows to `NewsPage`. Add `tsd` to devDependencies and to the `lint`/`test` script.

## Verification (end to end)

1. `pnpm install` (adds the three `@microlink/*` deps).
2. `pnpm test` — runs `standard` + `standard-markdown` lint, then `c8 ava` (unit + integration).
3. Manual library check:
   ```js
   const microlink = require('.')()
   console.log(await microlink.markdown('https://example.com'))      // string
   console.log(await microlink.screenshot('https://example.com'))    // { url, type, ... }
   console.log((await microlink.search('coffee', { limit: 3 })).results.length)
   ```
4. Manual CLI check:
   ```bash
   node bin/index.js markdown https://example.com
   node bin/index.js screenshot https://example.com --fullPage
   node bin/index.js search "coffee" --limit 3
   ```
5. Confirm ESM path: `node --input-type=module -e "import create from './src/main.mjs'; console.log(typeof create().markdown)"`.

## Open follow-ups (not blocking v1)

- Expose a `buffer`/`stream` escape hatch on `screenshot`/`pdf` if users ask for raw bytes
  (`mql.buffer` already supports it).
- Consider deprecating `@microlink/cli` in favor of this product CLI once parity is confirmed.
- `search` can't forward `options.headers` to the HTTP layer: `@microlink/google` calls
  `mql(url, opts)` with only two args (`google/src/index.js`), so there's no `gotOpts` seam. Auth
  via `apiKey` works (query/`x-api-key`); secret target-site headers don't. Fine for v1 (search
  rarely needs them); fix upstream by adding a 3rd-arg passthrough to `@microlink/google` if needed.
