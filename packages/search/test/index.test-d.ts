import { expectType } from 'tsd'
import createGoogleClient from '../src/index.js'

const google = createGoogleClient({ apiKey: 'MyApiToken' })

async function search (): Promise<void> {
  const page = await google('coffee')
  expectType<string>(page.results[0].url)
  expectType<typeof page>(await page.next())

  const news = await google('coffee', { type: 'news', limit: 3 })
  expectType<string>(news.results[0].publisher)
}
void search()

expectType<string>(createGoogleClient.DOMAIN)
expectType<string>(createGoogleClient.buildPath('coffee', 10, 'es'))
expectType<URL>(createGoogleClient.buildUrl('coffee', { type: 'news' }))
