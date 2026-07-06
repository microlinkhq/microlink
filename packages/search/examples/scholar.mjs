'use strict'

import createGoogleClient from '@microlink/google'

const google = createGoogleClient({
  apiKey: process.env.MICROLINK_API_KEY
})

const page = await google('attention is all you need transformer', {
  type: 'scholar'
})

console.log(page)
