import { randomBytes, randomUUID } from 'node:crypto'

import { listenForConnect } from './checkout-handshake.js'

const dashboardUrl = () =>
  process.env.MICROLINK_DASHBOARD_URL || 'https://dashboard.microlink.io'

const connectTimeoutMs = () => {
  const raw = process.env.MICROLINK_CONNECT_TIMEOUT_MS
  const parsed = raw == null || raw === '' ? NaN : Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 5 * 60 * 1000
}

class DashboardApiError extends Error {
  constructor (payload) {
    super(payload.message)
    this.payload = payload
  }
}

async function request (path, options = {}) {
  const response = await fetch(`${dashboardUrl()}${path}`, options)
  const body = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new DashboardApiError({
      message:
        body.error ||
        `Dashboard request failed with status ${response.status}.`,
      reason: 'dashboard_request_failed',
      statusCode: response.status,
      hint: 'Check the input and retry only after correcting the reported error.'
    })
  }

  return body
}

function withoutApiKey (body) {
  if (body == null || typeof body !== 'object' || Array.isArray(body)) { return body }
  const safe = { ...body }
  delete safe.apiKey
  return safe
}

function unknownSession (sessionId) {
  return new DashboardApiError({
    message: `Unknown checkout session \`${sessionId}\`.`,
    reason: 'unknown_checkout_session',
    statusCode: 404,
    hint: 'Use the exact `sessionId` returned by `microlink_create_checkout_session`; create a new session if it is unavailable.'
  })
}

function failurePayload (error, { idempotencyKey, planId }) {
  if (
    error instanceof DashboardApiError &&
    error.payload.statusCode === 400 &&
    /unknown plan/i.test(error.message)
  ) {
    return {
      message: `Unknown planId \`${planId}\`.`,
      reason: 'unknown_plan',
      statusCode: 400,
      idempotencyKey,
      hint: 'Call `microlink_list_plans`, then retry with an available `planId` and a new `idempotencyKey`.'
    }
  }

  if (error instanceof DashboardApiError) {
    return {
      ...error.payload,
      idempotencyKey,
      hint: `${error.payload.hint} Reuse \`idempotencyKey\` when retrying this logical checkout call.`
    }
  }

  return {
    message: error?.message || String(error),
    reason: 'dashboard_request_failed',
    idempotencyKey,
    hint: 'Check network access before retrying this logical checkout call. Reuse `idempotencyKey` when retrying.'
  }
}

const handshakes = new Map()
const byIdempotencyKey = new Map()

function present (record) {
  return {
    sessionId: record.id,
    connectUrl: record.connectUrl,
    idempotencyKey: record.idempotencyKey,
    expiresAt: record.expiresAt,
    ...(record.checkoutUrl ? { checkoutUrl: record.checkoutUrl } : {})
  }
}

async function openStripeSession (record, token) {
  try {
    const session = await request('/api/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'idempotency-key': record.idempotencyKey,
        authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ planId: record.planId, label: record.label })
    })

    if (
      typeof session?.sessionId !== 'string' ||
      typeof session?.checkoutUrl !== 'string'
    ) {
      record.error = {
        message:
          'Dashboard checkout response was missing sessionId or checkoutUrl.',
        reason: 'dashboard_request_failed',
        idempotencyKey: record.idempotencyKey,
        hint: 'Retry this logical checkout call with the same `idempotencyKey`.'
      }
      record.phase = 'error'
      return
    }

    record.stripeSessionId = session.sessionId
    record.checkoutUrl = session.checkoutUrl
    if (typeof session.expiresAt === 'number') { record.expiresAt = session.expiresAt }
    record.phase = 'checkout'
  } catch (error) {
    record.error = failurePayload(error, record)
    record.phase = 'error'
  }
}

function forget (record) {
  record.close?.()
  handshakes.delete(record.id)
  if (byIdempotencyKey.get(record.idempotencyKey) === record) {
    byIdempotencyKey.delete(record.idempotencyKey)
  }
}

export function resetCheckoutHandshakes () {
  for (const record of handshakes.values()) record.close?.()
  handshakes.clear()
  byIdempotencyKey.clear()
}

export async function listPlans () {
  return request('/api/v1/plans')
}

export async function createCheckoutSession ({
  planId,
  label = 'default',
  idempotencyKey = randomUUID()
}) {
  const existing = byIdempotencyKey.get(idempotencyKey)
  if (existing && existing.phase !== 'expired' && existing.phase !== 'error') {
    if (existing.planId !== planId || existing.label !== label) {
      throw new DashboardApiError({
        message:
          'idempotencyKey was already used for a different plan or label.',
        reason: 'idempotency_conflict',
        idempotencyKey,
        hint: 'Retry with a new `idempotencyKey`, or reuse the original `planId` and `label`.'
      })
    }
    return present(existing)
  }
  if (existing) forget(existing)

  const state = randomBytes(16).toString('hex')
  const timeoutMs = connectTimeoutMs()
  const record = {
    id: `hs_${randomUUID()}`,
    planId,
    label,
    idempotencyKey,
    phase: 'waiting',
    connectUrl: null,
    checkoutUrl: null,
    stripeSessionId: null,
    error: null,
    expiresAt: Math.floor((Date.now() + timeoutMs) / 1000),
    close: () => {}
  }

  const listener = await listenForConnect({
    state,
    timeoutMs,
    onToken: token => {
      if (record.phase !== 'waiting') return false
      record.phase = 'authorizing'
      openStripeSession(record, token).catch(error => {
        if (record.phase !== 'authorizing') return
        record.error = failurePayload(error, record)
        record.phase = 'error'
      })
      return true
    },
    onTimeout: () => {
      if (record.phase !== 'waiting') return
      record.phase = 'expired'
    }
  })

  record.close = listener.close
  const url = new URL('/connect', dashboardUrl())
  url.searchParams.set('port', String(listener.port))
  url.searchParams.set('state', state)
  url.searchParams.set('plan', planId)
  record.connectUrl = url.toString()

  handshakes.set(record.id, record)
  byIdempotencyKey.set(idempotencyKey, record)
  return present(record)
}

async function pollHandshake (sessionId) {
  const record = handshakes.get(sessionId)
  if (record == null) throw unknownSession(sessionId)
  if (record.phase === 'error') throw new DashboardApiError(record.error)
  if (record.phase === 'expired') return { state: 'expired' }
  if (record.phase !== 'checkout') {
    return { state: 'open', connectUrl: record.connectUrl }
  }

  try {
    const body = await request(
      `/api/v1/checkout/sessions/${encodeURIComponent(record.stripeSessionId)}`
    )
    const safe = withoutApiKey(body)
    if (safe == null || typeof safe !== 'object' || Array.isArray(safe)) { return safe }
    return record.checkoutUrl
      ? { ...safe, checkoutUrl: record.checkoutUrl }
      : safe
  } catch (error) {
    if (
      error instanceof DashboardApiError &&
      error.payload.statusCode === 404 &&
      /unknown checkout session/i.test(error.message)
    ) {
      throw unknownSession(sessionId)
    }
    throw error
  }
}

export async function getCheckoutSession ({ sessionId }) {
  if (typeof sessionId === 'string' && sessionId.startsWith('hs_')) {
    return pollHandshake(sessionId)
  }

  try {
    return withoutApiKey(
      await request(
        `/api/v1/checkout/sessions/${encodeURIComponent(sessionId)}`
      )
    )
  } catch (error) {
    if (
      error instanceof DashboardApiError &&
      error.payload.statusCode === 404 &&
      /unknown checkout session/i.test(error.message)
    ) {
      throw unknownSession(sessionId)
    }
    throw error
  }
}
