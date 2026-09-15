const DASHBOARD_URL = 'https://dashboard.microlink.io'

class DashboardApiError extends Error {
  constructor (payload) {
    super(payload.message)
    this.payload = payload
  }
}

async function request (path, options = {}) {
  const response = await fetch(`${DASHBOARD_URL}${path}`, options)
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

export async function listPlans () {
  return request('/api/v1/plans')
}

export async function createCheckoutSession ({
  email,
  planId,
  label = 'default',
  idempotencyKey = crypto.randomUUID()
}) {
  try {
    const session = await request('/api/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'idempotency-key': idempotencyKey
      },
      body: JSON.stringify({ email, planId, label })
    })

    return { ...session, idempotencyKey }
  } catch (error) {
    if (
      error instanceof DashboardApiError &&
      error.message === 'Unknown plan'
    ) {
      const { plans } = await listPlans()
      throw new DashboardApiError({
        message: `Unknown planId \`${planId}\`.`,
        reason: 'unknown_plan',
        statusCode: error.payload.statusCode,
        availablePlans: plans,
        idempotencyKey,
        hint: 'Choose an `id` from `availablePlans` and call this tool again with that `planId` and the same `idempotencyKey`.'
      })
    }

    if (error instanceof DashboardApiError) {
      error.payload.idempotencyKey = idempotencyKey
      error.payload.hint = `${error.payload.hint} Reuse \`idempotencyKey\` when retrying this logical checkout call.`
    }
    throw error
  }
}

export async function getCheckoutSession ({ sessionId }) {
  try {
    return await request(
      `/api/v1/checkout/sessions/${encodeURIComponent(sessionId)}`
    )
  } catch (error) {
    if (
      error instanceof DashboardApiError &&
      error.message === 'Unknown checkout session'
    ) {
      throw new DashboardApiError({
        message: `Unknown checkout session \`${sessionId}\`.`,
        reason: 'unknown_checkout_session',
        statusCode: error.payload.statusCode,
        hint: 'Use the exact `sessionId` returned by `microlink_create_checkout_session`; create a new session if it is unavailable.'
      })
    }
    throw error
  }
}
