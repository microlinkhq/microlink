import { expectAssignable, expectType } from 'tsd'
import create, { MicrolinkError } from '../src/index.js'

type Asset = Awaited<ReturnType<ReturnType<typeof create>['screenshot']>>

const client = create({ apiKey: 'MyApiToken' })

client.metadata('https://example.com', {
  proxy: { location: 'US' }
})
client.metadata('https://example.com', {
  proxy: { url: 'http://user:pass@proxy.example:8080' }
})
client.metadata('https://example.com', {
  proxy: 'http://user:pass@proxy.example:8080'
})

expectType<Promise<string | null>>(client.markdown('https://example.com'))
expectType<Promise<string | null>>(
  client.markdown('https://example.com', { selector: 'article' })
)
expectType<Promise<string | null>>(client.html('https://example.com'))
expectType<Promise<string | null>>(client.text('https://example.com'))

expectType<Promise<string[]>>(client.links('https://example.com'))
expectType<Promise<string[]>>(client.emails('https://example.com'))
expectType<Promise<string[]>>(
  client.images('https://example.com', { selectorAll: 'article img' })
)
expectType<Promise<string[]>>(client.videos('https://example.com'))
expectType<Promise<string[]>>(client.audios('https://example.com'))

async function assertions (): Promise<void> {
  const screenshot = await client.screenshot('https://example.com', {
    fullPage: true,
    device: 'iPhone 11'
  })
  expectType<string>(screenshot.url)

  const pdf = await client.pdf('https://example.com', { format: 'A4' })
  expectType<string>(pdf.url)

  const logo = await client.logo('https://example.com', { square: true })
  expectType<Asset | null>(logo)
  if (logo !== null) expectType<string>(logo.url)

  const video = await client.video('https://vimeo.com/76979871')
  expectType<Asset | null>(video)
  if (video !== null) expectType<string>(video.url)

  const audio = await client.audio('https://example.com')
  expectType<Asset | null>(audio)
  if (audio !== null) expectType<string>(audio.url)

  const metadata = await client.metadata('https://example.com')
  expectAssignable<Record<string, unknown>>(metadata)

  const embed = await client.embed('https://example.com')
  expectType<string>(embed.html)

  const data = await client.extract('https://example.com', {
    avatar: { selector: 'img', attr: 'src', type: 'image' }
  })
  expectAssignable<Record<string, unknown>>(data)

  const news = await client.search('coffee', { type: 'news', limit: 3 })
  expectAssignable<{ results: Array<{ publisher: string }> }>(news)

  const page = await client.search('coffee')
  expectType<typeof page>(await page.next())

  const fnResult = await client.function('https://example.com', '() => 1')
  expectType<boolean>(fnResult.isFulfilled)
}

void assertions()

expectAssignable<Error>(new MicrolinkError({ code: 'EFAKE' }))
expectType<typeof MicrolinkError>(create.MicrolinkError)
