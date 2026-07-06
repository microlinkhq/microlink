'use strict'

import createGoogleClient from '@microlink/google'

const google = createGoogleClient({
  apiKey: process.env.MICROLINK_API_KEY
})

const page = await google('site:developer.mozilla.org fetch api', {
  type: 'search'
})

console.log(page)
