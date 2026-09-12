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

const isPlainObject = value =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

function toToolResponse (isError, field, value) {
  return {
    isError,
    structuredContent: { [field]: value },
    content: [{ type: 'text', text: JSON.stringify(value, null, 2) }]
  }
}

// Every tool returns the library's direct result (a string, array, or object).
// MCP `structuredContent` must be an object, so wrap the value under `data`.
export function asToolResult (value) {
  return toToolResponse(false, 'data', value ?? null)
}

// The API wraps some failures in a generic top-level message ("The request
// has been not processed…"), while the specific cause travels in `data`
// (e.g. `data.url`). Only then should the data-derived message lead: a
// specific description is the real cause and must not be hidden by
// auxiliary strings in `data`.
const GENERIC_API_MESSAGE = 'The request has been not processed.'

function toErrorPayload (error) {
  const isMql = error instanceof MicrolinkError
  const statusCode = isMql ? error.statusCode : undefined
  const description = isMql ? error.description : undefined

  const details = isMql && isPlainObject(error.data) ? error.data : undefined
  const detailMessage =
    details &&
    Object.values(details)
      .filter(value => typeof value === 'string')
      .join(' ')

  const isGenericDescription =
    typeof description === 'string' &&
    description.startsWith(GENERIC_API_MESSAGE)

  const payload = {
    message:
      (isGenericDescription ? detailMessage : undefined) ||
      description ||
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

  return payload
}

export function asErrorResult (error) {
  const payload =
    isPlainObject(error) &&
    !(error instanceof Error) &&
    typeof error.message === 'string'
      ? error
      : toErrorPayload(error)

  return toToolResponse(true, 'error', payload)
}
