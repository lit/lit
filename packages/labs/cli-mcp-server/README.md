# @lit-labs/mcp-server

A Model Context Protocol (MCP) server for Lit-related tools.

> [!WARNING]
>
> This package is part of [Lit Labs](https://lit.dev/docs/libraries/labs/). It
> is published in order to get feedback on the design and may receive breaking
> changes or stop being supported.
>
> Please read our [Lit Labs documentation](https://lit.dev/docs/libraries/labs/)
> before using this library in production.
>
> Give feedback: https://github.com/lit/lit/discussions

## Installation

This is the serverConfig for the MCP client. You may have to follow the instructions for your specific MCP-enabled application to install this server.

```json
{
  "mcpServers": {
    "lit": {
      "command": "npx",
      "args": ["@lit-labs/cli", "labs", "mcp", "--autoinstall"],
      "alwaysAllow": ["search_lit_dev_docs"]
    }
  }
}
```

**Application-specific instructions:**

- [VS Code](https://code.visualstudio.com/docs/copilot/chat/mcp-servers)
- [Cursor](https://docs.cursor.com/context/model-context-protocol)
- [Roo Code](https://docs.roocode.com/features/mcp/using-mcp-in-roo)
- [Cline](https://docs.cline.bot/mcp/configuring-mcp-servers)
- [Claude Desktop](https://modelcontextprotocol.io/quickstart/user)
- [Windsurf](https://docs.windsurf.com/windsurf/cascade/mcp#model-context-protocol-mcp)

This will make the tools provided by this server available under the "lit" server name.

## Available Tools

### `search_lit_dev_docs`

Compatible environments: `any`

Searches the [lit.dev](https://lit.dev) documentation.

If you are working in a Lit repo, you may want to suggest that this tool is
available to your agent in your repository's agent rules (e.g. CLAUDE.md,
.cursorrules, etc.).

> [!note] Some results may only return a URL with no content.
> For example, external sites such as MDN, Webkit, or YouTube. You may need to
> have another tool available to your agent to fetch the content of the URL to
> enhance the results if not already packaged with your agent.

#### Parameters

| Parameter    | Type     | Description                                                            |
| ------------ | -------- | ---------------------------------------------------------------------- |
| `query`      | `string` | **Required.** The search query string.                                 |
| `maxResults` | `number` | _Optional._ Maximum number of distinct results to return (default: 5). |
| `page`       | `number` | _Optional._ Page number of results to return (0-indexed, default: 0).  |

## Contributing

Please see [CONTRIBUTING.md](../../../CONTRIBUTING.md).
