'use strict'

const { randomUUID } = require('crypto')
const readline = require('readline')
const select = require('./select')
const openUrl = require('./open')
const { gray } = require('./style')

const TIMEOUT_MS = 15 * 60 * 1000
const POLL_MS = 2000

const dashboardUrl = () =>
  process.env.MICROLINK_DASHBOARD_URL || 'https://dashboard.microlink.io'

const request = async (path, options) => {
  const res = await fetch(new URL(path, dashboardUrl()), options)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(body.error || `Dashboard request failed (${res.status})`)
  }
  return body
}

const money = (amount, currency) =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: amount % 100 === 0 ? 0 : 2
  }).format(amount / 100)

const asChoice = plan => ({
  name: `${plan.limit.toLocaleString()} req`,
  hint: `${money(plan.price, plan.currency)}/mo`,
  value: plan.id
})

const ask = message =>
  new Promise(resolve => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stderr
    })
    rl.question(`${message} `, answer => {
      rl.close()
      resolve(answer.trim())
    })
  })

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

const buy = async ({ email, plan: planId } = {}) => {
  const { plans } = await request('/api/v1/plans')
  if (!plans?.length) throw new Error('No plans available')

  if (!planId) {
    planId = (
      await select({
        message: 'Which plan?',
        choices: plans.map(asChoice)
      })
    ).value
  } else if (!plans.some(plan => plan.id === planId)) {
    throw new Error(`Unknown plan \`${planId}\``)
  }

  if (!email) email = await ask('Email:')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Invalid email')
  }

  const session = await request('/api/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'idempotency-key': randomUUID()
    },
    body: JSON.stringify({ email, planId, label: 'default' })
  })

  process.stderr.write(`Opening ${session.checkoutUrl}\n\n`)
  if (process.stderr.isTTY) openUrl(session.checkoutUrl)

  const started = Date.now()
  process.stderr.write('Waiting for payment…\n')
  for (;;) {
    const status = await request(
      `/api/v1/checkout/sessions/${encodeURIComponent(session.sessionId)}`
    )
    if (status.state === 'ready') {
      process.stderr.write(
        `\n${gray('Paid.')} Run \`microlink login\` to save your API key.\n`
      )
      return
    }
    if (status.state === 'expired') throw new Error('Checkout expired')
    if (Date.now() - started > TIMEOUT_MS) {
      throw new Error('Timed out waiting for payment')
    }
    await sleep(POLL_MS)
  }
}

module.exports = buy
