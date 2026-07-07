import {
  asErrorResult,
  asToolResult,
  client,
  resolveApiKey
} from '../microlink-client.js'

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

export function register (server, name, description, inputSchema, invoke) {
  server.registerTool(
    name,
    { description, inputSchema },
    async (args, extra) => {
      const parsed = inputSchema.safeParse(args)

      if (!parsed.success) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  message: 'Input validation failed.',
                  issues: parsed.error.issues
                },
                null,
                2
              )
            }
          ]
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
