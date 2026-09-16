'use strict'

const { randomUUID } = require('crypto')
const { writeConfig, configPathDisplay } = require('./config')
const { dashboardUrl, authorize, debugResponse } = require('./dashboard')
const select = require('./select')
const openUrl = require('./open')
const { gray } = require('./style')

const TIMEOUT_MS = 15 * 60 * 1000
const POLL_MS = 2000

const request = async (path, options) => {
  const method = options?.method || 'GET'
  const res = await fetch(new URL(path, dashboardUrl()), options)
  const body = await res.json().catch(() => ({}))
  debugResponse(method, path, res.status, body)
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

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

const pickPlan = async (plans, planId) => {
  if (planId) {
    if (!plans.some(plan => plan.id === planId)) {
      throw new Error(`Unknown plan \`${planId}\``)
    }
    return planId
  }
  const { value } = await select({
    message: 'Which plan?',
    choices: plans.map(asChoice)
  })
  return value
}

const waitForPayment = async sessionId => {
  const started = Date.now()
  const path = `/api/v1/checkout/sessions/${encodeURIComponent(sessionId)}`
  for (;;) {
    const body = await request(path)
    if (body.state === 'ready') return body
    if (body.state === 'expired') throw new Error('Checkout expired')
    if (Date.now() - started > TIMEOUT_MS) {
      throw new Error('Timed out waiting for payment')
    }
    await sleep(POLL_MS)
  }
}

const buy = async ({ plan: planId } = {}) => {
  const { plans } = await request('/api/v1/plans')
  if (!plans?.length) throw new Error('No plans available')

  planId = await pickPlan(plans, planId)
  const { token, sessionId, checkoutUrl } = await authorize({ plan: planId })

  const session =
    sessionId != null && checkoutUrl != null
      ? { sessionId, checkoutUrl }
      : await request('/api/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'idempotency-key': randomUUID(),
          authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ planId, label: 'default' })
      })

  if (sessionId == null) {
    process.stderr.write(`Opening ${session.checkoutUrl}\n\n`)
    if (process.stderr.isTTY) openUrl(session.checkoutUrl)
  }

  process.stderr.write('Waiting for payment…\n')
  const { apiKey } = await waitForPayment(session.sessionId)
  if (typeof apiKey !== 'string' || apiKey === '') {
    process.stderr.write(
      `\n${gray('Paid.')} Run \`microlink login\` to save your API key.\n`
    )
    return
  }
  writeConfig({ apiKey })
  process.stdout.write(`${apiKey}\n`)
  process.stderr.write(
    `\n${gray('Saved')} ${gray(`to ${configPathDisplay()}`)}\n`
  )
}

module.exports = buy
