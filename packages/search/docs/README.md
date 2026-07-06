<div align="center">
  <img src="https://search.microlink.io/static/banner.jpg" class="hero-banner" alt="Microlink Google API interface preview" width="2400" height="1256">
  <br>
  <br>
  <p>Consume Google as API for agents, copilots, and LLM-powered products. Powered by <a href="https://microlink.io" target="_blank" rel='noopener noreferrer'>microlink.io</a></p>
  <img class="badge" src="https://img.shields.io/github/tag/microlinkhq/google.svg?style=flat-square" alt="Last version" width="72" height="20"><a href="https://coveralls.io/github/microlinkhq/google"><img class="badge" src="https://img.shields.io/coveralls/microlinkhq/google.svg?style=flat-square" alt="Coverage status" width="184" height="20"></a><a href="https://www.npmjs.org/package/@microlink/google"><img class="badge" src="https://img.shields.io/npm/dm/@microlink/google.svg?style=flat-square" alt="NPM status" width="140" height="20"></a>
  <br>
</div>

## What is @microlink/google?

The `@microlink/google` library is a Node.js package that turns Google products such as Search, News, Images, Maps, Shopping, Scholar, and Autocomplete into structured API responses.

It is designed for developers building LLM tools, AI agents, research copilots, monitoring workflows, and products that need fresh Google data without parsing raw SERP HTML.

Additionally, the library supports serializing the content into HTML or Markdown in case you want to create your own parser.

## Built for LLM tooling

`@microlink/google` is designed for products that need fresh Google data in a format LLMs can reliably consume.

- **Search augmentation for agents**<br>
  Give agents access to structured Google results instead of forcing them to parse raw SERP markup.

- **RAG and retrieval pipelines**<br>
  Pull live Search, News, Scholar, Shopping, or Maps data into retrieval workflows, then fetch full page HTML only when needed.

- **Research copilots**<br>
  Build assistants that can compare sources, inspect pagination, expand related searches, and gather context across multiple Google verticals.

- **LLM-friendly schemas**<br>
  Consistent fields such as `title`, `url`, `description`, `price`, `rating`, `coordinates`, and image metadata reduce prompt complexity and post-processing.

## Best for

- **Google Search API for AI agents**<br>
  Give tool-calling systems a reliable way to search the live web and return structured result objects.

- **Google News API for assistants**<br>
  Monitor recent developments, fetch publishers and dates, and summarize fresh stories inside AI workflows.

- **Google Scholar API for research copilots**<br>
  Retrieve papers, citations, and academic sources for technical or scientific research tasks.

- **Google Maps and Places API for entity lookup**<br>
  Resolve businesses, addresses, phone numbers, coordinates, ratings, and local context.

## Installation

Install the package from npm and use it anywhere you need structured Google data in a Node.js workflow.

```bash
npm install @microlink/google
```

## Quick start

Start with a minimal query, inspect the structured response, and then expand into HTML fetches or pagination only when needed.

### Your first query

The only prerequisite to initialize `@microlink/google` is to have [Microlink API key](https://microlink.io/#pricing):

```js
const google = require('@microlink/google')({
  apiKey: process.env.MICROLINK_API_KEY
})
```

Make your first query:

```js
const page = await google('Lotus Elise S2')

console.log(page.results)
// [
//   {
//     title: 'Lotus Elise - Wikipedia',
//     url: 'https://en.wikipedia.org/wiki/Lotus_Elise',
//     description: 'The Lotus Elise is a two-seat, rear-wheel-drive...'
//   }
// ]
```

Use [Google search operators](https://ahrefs.com/blog/google-advanced-search-operators/) to refine queries:

```js
const page = await google('Lotus Elise S2 filetype:pdf')
```

Localize results using `location` or filter by time with `period`:

```js
await google('recetas de pasta', {
  location: 'es',
  period: 'week'
})
```

### Return shape for tools

A typical search response is easy to pass into an LLM tool result:

```js
const page = await google('typescript runtime')

console.log({
  type: page.type,
  total: page.results.length,
  results: page.results.slice(0, 2)
})
```

This usually gives you a compact object containing entries like:

```js
{
  title: 'TypeScript: Documentation',
  url: 'https://www.typescriptlang.org/docs/',
  description: 'TypeScript extends JavaScript by adding types...'
}
```

### Get page markup

Any result containing a `url` exposes lazy `.html()` and `.markdown()` methods:

```js
const { results } = await google('node.js frameworks')

for (const result of results) {
  console.log(await result.html())
  console.log(await result.markdown())
}
```

### Pagination

Pages chain naturally:

```js
const page1 = await google('node.js frameworks')
const page2 = await page1.next()
const page3 = await page2.next()
```

You can also iterate:

```js
let page = await google('node.js frameworks')

while (page) {
  for (const result of page.results) {
    console.log(result.title)
  }

  page = await page.next()
}
```

## LLM integration patterns

### 1. Tool calling

Expose `google(query, options)` as a tool and let the model choose:

- when to use Search vs News vs Scholar
- when to request the next page
- when to expand a result with `.html()` or `.markdown()`

### 2. Multi-step research agents

A common pattern looks like:

1. search for the topic
2. inspect the top results
3. fetch HTML for the most promising sources
4. summarize or compare the sources
5. paginate if confidence is still low

### 3. Vertical routing

Instead of one generic search tool, route intent by task:

- `search`: general web retrieval
- `news`: recent developments
- `scholar`: papers and citations
- `shopping`: product comparisons
- `places` / `maps`: local business context
- `autocomplete`: query expansion and prompt suggestion

### 4. Query expansion

Use Autocomplete and related searches to improve retrieval coverage:

```js
const page = await google('how to fine tune', { type: 'autocomplete' })
console.log(page.results)
```

## What makes it LLM-friendly

- **Structured outputs by default**: easier prompting, fewer parsing failures
- **Type-aware fields**: prices, ratings, coordinates, and images are normalized
- **Composable depth**: lightweight result first, HTML second
- **Cross-vertical coverage**: one package for multiple Google surfaces
- **Tool ergonomics**: simple `google(query, options)` interface for agent frameworks

## Google verticals for LLM apps

Use the lookup below to match each Google vertical with the kind of workflow it supports best.

| Type           | Product             | Best for                                                 | Example                                                     |
| -------------- | ------------------- | -------------------------------------------------------- | ----------------------------------------------------------- |
| `search`       | Google Search       | General web retrieval, brand lookup, related questions   | `google('Lotus Elise S2')`                                  |
| `news`         | Google News         | Recent developments, launches, incidents, market changes | `google('artificial intelligence', { type: 'news' })`       |
| `images`       | Google Images       | Visual references, image metadata, asset discovery       | `google('northern lights', { type: 'images' })`             |
| `videos`       | Google Videos       | Tutorials, content research, video SERP coverage         | `google('cooking tutorial', { type: 'videos' })`            |
| `places`       | Google Places       | Local entities, addresses, phone numbers, coordinates    | `google('coffee shops denver', { type: 'places' })`         |
| `maps`         | Google Maps         | Rich place metadata, ratings, hours, pricing             | `google('apple store new york', { type: 'maps' })`          |
| `shopping`     | Google Shopping     | Product intelligence, prices, merchant comparisons       | `google('macbook pro', { type: 'shopping' })`               |
| `scholar`      | Google Scholar      | Academic and technical research workflows                | `google('transformer architecture', { type: 'scholar' })`   |
| `patents`      | Google Patents      | Prior-art, invention, and filing research                | `google('touchscreen gestures apple', { type: 'patents' })` |
| `autocomplete` | Google Autocomplete | Query expansion, intent mining, UX suggestions           | `google('how to', { type: 'autocomplete' })`                |

## Common LLM use cases

Choose a workflow below to jump straight to the tutorial:

- [Agentic search](#agentic-search)<br>
  Use Google Search as a tool for assistants that need current sources and structured result objects.

- [Source expansion for RAG](#source-expansion-for-rag)<br>
  Start with lightweight search results, then fetch full HTML only for the sources worth indexing or summarizing.

- [Live news monitoring for assistants](#live-news-monitoring-for-assistants)<br>
  Pull current Google News results into monitoring, summarization, and alerting workflows.

- [Entity and local lookup](#entity-and-local-lookup)<br>
  Use Places and Maps for local business context, coordinates, contact data, and place metadata.

### Agentic search

Use Google Search as a tool in an agent loop:

```js
const google = require('@microlink/google')({
  apiKey: process.env.MICROLINK_API_KEY
})

const page = await google('best vector databases for rag')

return page.results.map(result => ({
  title: result.title,
  url: result.url,
  summary: result.description
}))
```

### Source expansion for RAG

Start with Search, then fetch page HTML only for the most relevant sources:

```js
const page = await google('site:openai.com function calling guide')

const topSources = await Promise.all(
  page.results.slice(0, 3).map(async result => ({
    title: result.title,
    url: result.url,
    html: await result.html()
  }))
)
```

### Live news monitoring for assistants

Use Google News to give assistants current event context:

```js
const page = await google('open source llm', { type: 'news' })

console.log(page.results.map(({ title, date, source }) => ({
  title,
  date,
  source
})))
```

### Entity and local lookup

Use Places and Maps when your assistant needs business or location context:

```js
const page = await google('coffee shops denver', { type: 'places' })

console.log(page.results[0])
// {
//   title,
//   address,
//   phone,
//   coordinates: { latitude, longitude }
// }
```

## Google Search

Use Google Search when you need broad web retrieval with related questions, knowledge graph context, and query expansion.

Web results with knowledge graph, related questions, and related searches.

```js
const page = await google('Lotus Elise S2')

page.results[0]

page.knowledgeGraph
page.peopleAlsoAsk
page.relatedSearches
```

## Google News

Use Google News when freshness matters and your workflow depends on publishers, dates, and recent developments.

Recent articles with publisher, date, and thumbnail.

```js
const page = await google('artificial intelligence', { type: 'news' })
```

## Google Images

Use Google Images when you need image URLs, dimensions, and visual search results as structured data.

Full-resolution image URLs with dimensions.

```js
const page = await google('northern lights', { type: 'images' })
```

## Google Videos

Use Google Videos when your workflow needs video discovery, metadata, and duration-aware results.

Video metadata with duration in milliseconds.

```js
const page = await google('cooking tutorial', { type: 'videos' })
```

## Google Places

Use Google Places for local entity lookup, contact data, and coordinates.

Local business listings with coordinates and contact info.

```js
const page = await google('coffee shops denver', { type: 'places' })
```

## Google Maps

Use Google Maps when you need richer place metadata such as ratings, opening hours, and pricing.

Detailed place data with ratings, hours, and pricing.

```js
const page = await google('apple store new york', { type: 'maps' })
```

## Google Shopping

Use Google Shopping for product intelligence, merchant comparison, and structured price data.

Product listings with parsed prices and structured ratings.

```js
const page = await google('macbook pro', { type: 'shopping' })
```

## Google Scholar

Use Google Scholar for academic research workflows that need papers, citations, and publication context.

Academic papers with citation counts and PDF links.

```js
const page = await google('transformer architecture', { type: 'scholar' })
```

## Google Patents

Use Google Patents for invention research, prior-art analysis, and filing lookup.

Patent filings with ISO 8601 dates and metadata.

```js
const page = await google('touchscreen gestures apple', { type: 'patents' })
```

## Google Autocomplete

Use Google Autocomplete to expand queries, discover intent, and seed retrieval prompts.

Search suggestions as you type.

```js
const page = await google('how to', { type: 'autocomplete' })
```

## FAQ

These are the most common questions developers and AI teams ask before integrating `@microlink/google`.

### Is this only for LLM apps?

No. It works for any product that needs structured Google data. But it is especially useful for agent workflows, retrieval pipelines, and AI products that benefit from normalized output.

### Why not scrape Google HTML directly?

You can, but raw markup is harder to maintain, harder for LLM tools to consume, and usually requires much more custom parsing logic.

### Can I use it in tool-calling systems?

Yes. The interface is simple enough to wrap in tool definitions for agent frameworks, copilots, and orchestration systems.

### Can I paginate and inspect sources deeply?

Yes. Use `.next()` for pagination and `.html()` or `.markdown()` on any result with a `url` when you need full page markup.

## API

The API surface is intentionally small: one main function, a few routing options, and lazy helpers for deeper retrieval.

### google(query, options?)

#### query

**Required**
Type: `string`

The search query. Supports [Google search operators](https://support.google.com/websearch/answer/2466433).

```js
await google('annual report filetype:pdf')
await google('security updates site:github.com')
await google('"machine learning" site:arxiv.org')
```

#### options

Options let you choose the Google vertical, localize results, and constrain freshness.

##### type

Type: `string`<br>
Default: `'search'`<br>
Values: `'search'` | `'news'` | `'images'` | `'videos'` | `'places'` | `'maps'` | `'shopping'` | `'scholar'` | `'patents'` | `'autocomplete'`

Selects which Google product to query.

```js
await google('artificial intelligence', { type: 'news' })
```

##### location

Type: `string`<br>
Default: `'us'`<br>
Values: [Location](https://github.com/microlinkhq/google/blob/master/src/index.d.ts#L28)

Controls result geolocation using a country code ([ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)). This influences ranking, language, and local intent.

```js
await google('recetas de pasta', { location: 'es' })
```

##### period

Type: `string`<br>
Default: `undefined`<br>
Values: `'hour'` | `'day'` | `'week'` | `'month'` | `'year'`

Limits results to a recent time window. Useful for news monitoring and freshness-sensitive queries.

```js
await google('tech news', { period: 'week' })
```

## Disclosure

This library interacts with publicly available Google services and normalizes the resulting data.

It is not affiliated with, endorsed by, or sponsored by Google.

Use of this library must comply with Google’s Terms of Service, applicable laws, and any relevant data usage policies.

Users are responsible for their use of this library and any data obtained through it.

## License

**microlink/google** © [Microlink](https://microlink.io), released under the [MIT](https://github.com/microlinkhq/google/blob/master/LICENSE.md) License.<br>
Authored and maintained by [Kiko Beats](https://kikobeats.com) with help from [contributors](https://github.com/microlinkhq/google/contributors).

> [microlink.io](https://microlink.io) · GitHub [microlinkhq](https://github.com/microlinkhq) · X [@microlinkhq](https://x.com/microlinkhq)
