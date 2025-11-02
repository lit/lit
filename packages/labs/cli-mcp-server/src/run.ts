#!/usr/bin/env node

/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {searchLitDevDocs} from './search-lit-dev.js';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import type {McpOptions, ToolDeclaration} from './types.js';

const tools: ToolDeclaration[] = [searchLitDevDocs];

export async function run({environment}: McpOptions, console: Console) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  // Assuming index.js is in 'lib', package.json is one level up from 'lib'
  const packageJsonPath = path.resolve(__dirname, '../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

  const server = new McpServer({
    name: 'Lit MCP Server',
    version: packageJson.version || '0.0.0',
  });

  for (const tool of tools) {
    console.debug(`Registering tools for environment: ${environment}`);

    if (
      tool.environmentCompatibility === 'any' ||
      tool.environmentCompatibility === environment
    ) {
      console.debug(
        `Registering tool: ${tool.id} with environment compatibility: ${tool.environmentCompatibility}`
      );
      tool.register(server);
    }
  }

  const transport = new StdioServerTransport();

  console.debug(`MCP server version: ${packageJson.version || '0.0.0'}`);
  console.debug(`Starting MCP server in ${environment} mode...`);

  await server.connect(transport);

  console.info(`MCP server is running in ${environment} mode.`);

  let resolve = () => {};
  let reject = (_err: unknown) => {};

  const exitPromise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  transport.onerror = (error: Error) => {
    console.error('Transport error:', error);
    reject(error);
  };

  transport.onclose = () => {
    console.log('Transport closed.');
    resolve();
  };

  await exitPromise;
}
