import createClient, { MicrolinkError } from 'microlink.io'

const FREE_QUOTA_EXCEEDED_HINT =
  'Free daily quota reached (50 requests/day). Extend your limit by getting an API key at https://microlink.io/#pricing.'

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

export function asErrorResult (error) {
  const isMql = error instanceof MicrolinkError
  const statusCode = isMql ? error.statusCode : undefined

  const payload = {
    message:
      (isMql ? error.description : undefined) || error?.message || String(error)
  }

  if (isMql) {
    if (error.code) payload.code = error.code
    if (error.status) payload.status = error.status
    if (statusCode) payload.statusCode = statusCode
    if (error.url) payload.url = error.url
    if (error.more) payload.more = error.more
  }

  if (statusCode === 429) payload.hint = FREE_QUOTA_EXCEEDED_HINT

  return {
    isError: true,
    structuredContent: { error: payload },
    content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }]
  }
}
