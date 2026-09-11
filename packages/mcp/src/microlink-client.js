import createClient, { MicrolinkError } from 'microlink.io'

const UPGRADE_URL = 'https://microlink.io/#pricing'

const FREE_QUOTA_EXCEEDED_HINT = `Free daily quota reached. Extend your limit by getting an API key at ${UPGRADE_URL}.`

// Actionable guidance for capability errors that retrying cannot fix:
// what happened, why, and how to continue. `reason` and `capability` are
// machine-readable so clients can react programmatically; `hint` is the
// agent-facing next step.
const ERROR_GUIDANCE = {
  EPROXYNEEDED: {
    reason: 'upgrade_required',
    capability: 'proxy',
    hint: `The target website is behind antibot protection and needs the Microlink proxy network, included in PRO plans. The request is correct: get an API key at ${UPGRADE_URL}, pass it as \`apiKey\` (or set MICROLINK_API_KEY) and repeat the same call.`
  },
  EINTEGRATION: {
    reason: 'upgrade_required',
    capability: 'integration',
    hint: `This capability requires a PRO plan. Get an API key at ${UPGRADE_URL}, pass it as \`apiKey\` (or set MICROLINK_API_KEY) and repeat the same call.`
  }
}

// A single shared client; the per-request apiKey travels in the options bag.
export const client = createClient()

export { MicrolinkError }

export function resolveApiKey (inputApiKey, headerApiKey) {
  return (
    inputApiKey || headerApiKey || process.env.MICROLINK_API_KEY || undefined
  )
}

// Every tool returns the library's direct result (a string, array, or object).
// MCP `structuredContent` must be an object, so wrap the value under `data`.
export function asToolResult (value) {
  const data = value ?? null
  return {
    isError: false,
    structuredContent: { data },
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }]
  }
}

const isPlainObject = value =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

export function asErrorResult (error) {
  const isMql = error instanceof MicrolinkError
  const statusCode = isMql ? error.statusCode : undefined

  // The API puts the specific cause in `data` (e.g. `data.url`), while the
  // top-level message stays generic ("The request has been not processed…").
  // Surface the specific message so agents know what actually happened.
  const details = isMql && isPlainObject(error.data) ? error.data : undefined
  const detailMessage =
    details &&
    Object.values(details)
      .filter(value => typeof value === 'string')
      .join(' ')

  const payload = {
    message:
      detailMessage ||
      (isMql ? error.description : undefined) ||
      error?.message ||
      String(error)
  }

  if (isMql) {
    if (error.code) payload.code = error.code
    if (error.status) payload.status = error.status
    if (statusCode) payload.statusCode = statusCode
    if (error.url) payload.url = error.url
    if (error.more) payload.more = error.more
    if (details) payload.details = details
  }

  const guidance = isMql && ERROR_GUIDANCE[error.code]
  if (guidance) {
    payload.reason = guidance.reason
    payload.capability = guidance.capability
    payload.hint = guidance.hint
    payload.upgrade = { plan: 'pro', url: UPGRADE_URL }
  }

  if (statusCode === 429) {
    payload.reason = 'quota_exceeded'
    payload.hint = FREE_QUOTA_EXCEEDED_HINT
  }

  return {
    isError: true,
    structuredContent: { error: payload },
    content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }]
  }
}
