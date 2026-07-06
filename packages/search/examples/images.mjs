'use strict'

import createGoogleClient from '@microlink/google'

const google = createGoogleClient({
  apiKey: process.env.MICROLINK_API_KEY
})

const page = await google('kubernetes architecture diagram', {
  type: 'images'
})

console.log(page)
