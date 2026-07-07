import { asToolResult, callMicrolink } from '../microlink-client.js'

function getHeaderValueCaseInsensitive (headers, headerName) {
  if (!headers || typeof headers !== 'object') {
    return undefined
  }

  const lookup = headerName.toLowerCase()

  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === lookup) {
      if (Array.isArray(value)) {
        return value[0]
      }

      return value
    }
  }

  return undefined
}

function getApiKeyFromRequestHeaders (headers) {
  const authorization = getHeaderValueCaseInsensitive(headers, 'authorization')

  if (typeof authorization === 'string') {
    const match = /^Bearer\s+(.+)$/i.exec(authorization.trim())
    const bearerToken = match?.[1]?.trim()

    if (bearerToken) {
      return bearerToken
    }
  }

  const xApiKey = getHeaderValueCaseInsensitive(headers, 'x-api-key')
  if (typeof xApiKey === 'string') {
    const token = xApiKey.trim()
    if (token) {
      return token
    }
  }

  return undefined
}

export function register (
  server,
  name,
  description,
  inputSchema,
  forcedFlags,
  mapParams
) {
  server.registerTool(
    name,
    {
      description,
      inputSchema
    },
    async (args, extra) => {
      const parsedArgs = inputSchema.safeParse(args)
      if (!parsedArgs.success) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  message: 'Input validation failed.',
                  issues: parsedArgs.error.issues
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
        const data = mapParams ? mapParams(parsedArgs.data) : parsedArgs.data
        const params =
          data.apiKey || !headerApiKey
            ? data
            : {
                ...data,
                apiKey: headerApiKey
              }

        const result = await callMicrolink({
          params,
          forcedFlags
        })

        return asToolResult(result)
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  message:
                    'Microlink request failed before receiving an API response.',
                  error: error instanceof Error ? error.message : String(error)
                },
                null,
                2
              )
            }
          ]
        }
      }
    }
  )
}
