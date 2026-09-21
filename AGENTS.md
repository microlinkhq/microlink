# Agents

Product docs for agents live in [microlinkhq/skills](https://github.com/microlinkhq/skills), not only in this repo's READMEs.

When a change here would change how an agent calls Microlink, update the matching skill in the same effort (sibling checkout `../skills`, or a PR to that repo). Do not ship a removed or renamed API while the skill still documents the old one.

| Change in | Update |
| --- | --- |
| `packages/core`, `packages/function`, `packages/search`, root `README.md` | `microlink/SKILL.md` |
| `packages/mcp` | `microlink-mcp/SKILL.md` |
| HTTP query params, embed URLs, extract/function grammar | `microlink-api/SKILL.md` and `microlink-api/api-reference.md` |

That includes product methods, options, return types (including nullability), CLI commands/flags, MCP tools/config/errors, auth, and plan limits.
