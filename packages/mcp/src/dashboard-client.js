const dashboardUrl = () =>
  process.env.MICROLINK_DASHBOARD_URL || 'https://dashboard.microlink.io'

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

export async function listPlans () {
  return request('/api/v1/plans')
}

// Public guest Sign up. `/api/v1/checkout/sessions` now requires a connect
// token (CLI `microlink buy`); MCP has no local /connect handshake.
export async function createCheckoutSession () {
  try {
    return await request('/api/v1/checkout/signup', { method: 'POST' })
  } catch (error) {
    if (error instanceof DashboardApiError) throw error
    throw new DashboardApiError({
      message: error?.message || String(error),
      reason: 'dashboard_request_failed',
      hint: 'Check network access before retrying this logical checkout call.'
    })
  }
}

export async function getCheckoutSession ({ sessionId }) {
  try {
    const body = await request(
      `/api/v1/checkout/sessions/${encodeURIComponent(sessionId)}`
    )
    if (body == null || typeof body !== 'object') return body
    const { apiKey: _secret, ...safe } = body
    return safe
  } catch (error) {
    if (
      error instanceof DashboardApiError &&
      error.payload.statusCode === 404 &&
      /unknown checkout session/i.test(error.message)
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
