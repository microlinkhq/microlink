import createGoogleClient from '@microlink/google'

const google = createGoogleClient({
  apiKey: process.env.MICROLINK_API_KEY
})

const run = async () => {
  const page = await google('kikobeats', {
    type: 'search'
  })

  page.results.forEach(result => {
    console.log(result.url)
  })

  console.log(await page.markdown())
  console.log(JSON.stringify(page, null, 2))
}
run().catch(err => {
  console.error(err)
  process.exit(1)
})
