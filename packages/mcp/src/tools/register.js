import {
  asErrorResult,
  asToolResult,
  client,
  resolveApiKey
} from '../microlink-client.js'
import { outputSchemas } from '../output-schemas.js'

function getHeaderValueCaseInsensitive (headers, headerName) {
  if (!headers || typeof headers !== 'object') {
    return undefined
  }

  const lookup = headerName.toLowerCase()

  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === lookup) {
      return Array.isArray(value) ? value[0] : value
    }
  }

  return undefined
}

function getApiKeyFromRequestHeaders (headers) {
  const authorization = getHeaderValueCaseInsensitive(headers, 'authorization')

  if (typeof authorization === 'string') {
    const match = /^Bearer\s+(.+)$/i.exec(authorization.trim())
    const bearerToken = match?.[1]?.trim()
    if (bearerToken) return bearerToken
  }

  const xApiKey = getHeaderValueCaseInsensitive(headers, 'x-api-key')
  if (typeof xApiKey === 'string') {
    const token = xApiKey.trim()
    if (token) return token
  }

  return undefined
}

// Every tool is a remote read against the Microlink API: it never modifies
// the caller's environment. `microlink_function` is the exception: it runs
// caller-supplied code against the live page, so it is not declared read-only.
const READ_ONLY_ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  openWorldHint: true
}

export const INTERACTIVE_ANNOTATIONS = {
  readOnlyHint: false,
  openWorldHint: true
}

// Common shape: a tool that maps to `client.<method>(url, options)`.
export function urlMethod (method) {
  return (client, { url, ...options }) => client[method](url, options)
}

// Capability tools nest their config under a key (e.g. `screenshot: { ... }`)
// to match the Microlink API surface; the library takes a flat options bag, so
// flatten the config back out before calling it.
export function capabilityMethod (method, key) {
  return (client, { url, [key]: config, ...rest }) => {
    const options =
      config !== null && typeof config === 'object'
        ? { ...config, ...rest }
        : rest
    return client[method](url, options)
  }
}

export function register (
  server,
  name,
  description,
  inputSchema,
  invoke,
  annotations = READ_ONLY_ANNOTATIONS
) {
  // Every tool wraps its result as `structuredContent.data`; the output
  // schema describes that `data` value (see output-schemas.js). Error
  // results are exempt: the SDK skips output validation when `isError`.
  const key = name.replace(/^microlink_/, '')
  const dataSchema = outputSchemas[key]
  const outputSchema = dataSchema ? { data: dataSchema } : undefined

  server.registerTool(
    name,
    { description, inputSchema, outputSchema, annotations },
    async (args, extra) => {
      const parsed = inputSchema.safeParse(args)

      if (!parsed.success) {
        const payload = {
          message: 'Input validation failed.',
          issues: parsed.error.issues
        }
        return {
          isError: true,
          structuredContent: { error: payload },
          content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }]
        }
      }

      try {
        const headerApiKey = getApiKeyFromRequestHeaders(
          extra?.requestInfo?.headers
        )
        const apiKey = resolveApiKey(parsed.data.apiKey, headerApiKey)
        const params = apiKey ? { ...parsed.data, apiKey } : parsed.data

        const value = await invoke(client, params)
        return asToolResult(value)
      } catch (error) {
        return asErrorResult(error)
      }
    }
  )
}
