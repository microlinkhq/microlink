'use strict'

import createGoogleClient from '@microlink/google'

const google = createGoogleClient({
  apiKey: process.env.MICROLINK_API_KEY
})

const page = await google('node.js streams tutorial', {
  type: 'videos'
})

console.log(page)
