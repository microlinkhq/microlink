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
      error.payload.statusCode === 409
    ) {
      throw new DashboardApiError({
        message: error.message,
        reason: 'existing_account',
        statusCode: 409,
        idempotencyKey,
        hint: 'This email already has a Microlink account. Tell the human to sign in and use their existing API key (or `microlink login`). Do not create another checkout or keep polling.'
      })
    }

    if (
      error instanceof DashboardApiError &&
      error.payload.statusCode === 400 &&
      /unknown plan/i.test(error.message)
    ) {
      try {
        const { plans } = await listPlans()
        throw new DashboardApiError({
          message: `Unknown planId \`${planId}\`.`,
          reason: 'unknown_plan',
          statusCode: error.payload.statusCode,
          availablePlans: plans,
          idempotencyKey,
          hint: 'Choose an `id` from `availablePlans` and call this tool again with that `planId` and the same `idempotencyKey`.'
        })
      } catch (plansError) {
        if (
          plansError instanceof DashboardApiError &&
          plansError.payload.availablePlans
        ) {
          throw plansError
        }
        throw new DashboardApiError({
          message: `Unknown planId \`${planId}\`; the plan catalog could not be loaded.`,
          reason: 'unknown_plan',
          statusCode: error.payload.statusCode,
          idempotencyKey,
          hint: 'Call `microlink_list_plans`, then retry with an available `planId` and the same `idempotencyKey`.'
        })
      }
    }

    const payload =
      error instanceof DashboardApiError
        ? error.payload
        : {
            message: error?.message || String(error),
            reason: 'dashboard_request_failed',
            hint: 'Check network access before retrying this logical checkout call.'
          }

    throw new DashboardApiError({
      ...payload,
      idempotencyKey,
      hint: `${payload.hint} Reuse \`idempotencyKey\` when retrying this logical checkout call.`
    })
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
