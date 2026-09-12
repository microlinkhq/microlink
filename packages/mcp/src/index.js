import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'

import { tools } from './tools/index.js'

const require = createRequire(import.meta.url)
const { version: pkgVersion } = require('../package.json')

const DEFAULT_INSTRUCTIONS = [
  'Turn any public URL into screenshots, PDFs, metadata, readable content (Markdown, HTML or plain text), media sources, technology stacks, Lighthouse audits, Google search results or custom-scraped fields.',
  'Always pass full URLs including the protocol.',
  'Without an API key, requests use the free endpoint (50 requests/day); pass apiKey or set MICROLINK_API_KEY for PRO.',
  'On failure, read the error message and the hint/reason fields and adjust the request instead of retrying blindly.'
].join(' ')

export function createMicrolinkServer ({
  name = 'microlink-mcp-server',
  version = pkgVersion,
  instructions = DEFAULT_INSTRUCTIONS
} = {}) {
  const server = new McpServer(
    {
      name,
      version
    },
    { instructions }
  )

  tools(server)

  return server
}

export async function startStdioServer ({
  server = createMicrolinkServer(),
  transport = new StdioServerTransport()
} = {}) {
  await server.connect(transport)
  return { server, transport }
}

export async function shutdown ({ server, signal }) {
  if (signal) {
    console.error(`Received ${signal}. Shutting down...`)
  }

  try {
    await server.close()
  } catch {
    // No-op on shutdown.
  }

  process.exit(0)
}

export async function main () {
  const { server } = await startStdioServer()

  ;['SIGINT', 'SIGTERM'].forEach(signal => {
    process.on(signal, () => {
      shutdown({ server, signal })
    })
  })
}

const isEntryPoint =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href

if (isEntryPoint) {
  main().catch(error => {
    console.error('Failed to start Microlink stdio MCP server:', error)
    process.exit(1)
  })
}

export default createMicrolinkServer
