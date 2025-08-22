/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import type {ResolvedCommand} from '@lit-labs/cli';
import {run} from './run.js';
import type {McpOptions} from './types.js';

/**
 * Defines our interface within the Lit CLI.
 */
export const getCommand = (): ResolvedCommand => {
  return {
    kind: 'resolved',
    name: 'mcp',
    description: 'Lit MCP server',
    options: [
      {
        name: 'environment',
        type: String,
        alias: 'E',
        defaultValue: 'local',
        description:
          'The environment to run in, either "local" or "server". Server mode will ' +
          'only expose MCP commands that are available on the server which are commands that do ' +
          'not require local file access. Local mode includes tools like lit analyzer ' +
          'and manifest generation that need to read project files.',
        typeLabel: '"local", "server"',
      },
    ],
    async run(options, console) {
      try {
        await run(options as unknown as McpOptions, console);
        console.log('MCP server started successfully.');
        return {exitCode: 0};
      } catch (err) {
        return {
          exitCode: 1,
          error: err instanceof Error ? err.message : String(err),
        };
      }
    },
  };
};
