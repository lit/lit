/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';

export type Environment = 'local' | 'server';
export type ToolCompatibility = 'local' | 'any' | 'server';

export interface McpOptions {
  environment: Environment;
}

export interface ToolDeclaration {
  id: string;
  environmentCompatibility: ToolCompatibility;
  register: (server: McpServer) => void;
}
