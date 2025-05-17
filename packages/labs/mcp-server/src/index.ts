#!/usr/bin/env node
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {registerSearchLitDevDocsTool} from './search-lit-dev.js';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

async function main() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  // Assuming index.js is in 'lib', package.json is one level up from 'lib'
  const packageJsonPath = path.resolve(__dirname, '../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

  const server = new McpServer({
    name: 'Lit MCP Server',
    version: packageJson.version || '0.0.0',
  });

  registerSearchLitDevDocsTool(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error('Failed to start MCP server:', err);
  process.exit(1);
});
