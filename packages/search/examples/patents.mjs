'use strict'

import createGoogleClient from '@microlink/google'

const google = createGoogleClient({
  apiKey: process.env.MICROLINK_API_KEY
})

const page = await google('compiler optimization patent', {
  type: 'patents'
})

console.log(page)
