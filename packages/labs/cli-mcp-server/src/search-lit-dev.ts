#!/usr/bin/env node

/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
// Their package seems to not expose the index.js file, so we need to use the TS extenionless import.
// eslint-disable-next-line import/extensions
import {liteClient} from 'algoliasearch/lite';
import {z} from 'zod';
import {ToolDeclaration} from './types.js';

interface Hit {
  title?: string;
  heading?: string;
  relativeUrl?: string;
  text?: string;
  docType?: Record<string, string>;
  parentID?: string;
  objectID?: string;
  isExternal?: boolean;
  [key: string]: unknown;
}

const ALGOLIA_APP_ID = 'OC866NN61X';
const ALGOLIA_SEARCH_ONLY_KEY = 'a723d1de7ad89e567ad51eb1c3a7f59f';
const ALGOLIA_INDEX_NAME = 'lit.dev';
const ID = 'search_lit_dev_docs';

export const searchLitDevDocs: ToolDeclaration = {
  id: ID,
  environmentCompatibility: 'any',
  register: function (server: McpServer) {
    server.tool(
      ID,
      'Searches the lit.dev documentation. Use keywords rather than full ' +
        'sentences when searching with this tool. Additionally, some results may ' +
        'only return a URL with little content. For example, external sites such ' +
        'as MDN, Webkit, or YouTube. You may need to have another tool available ' +
        'to your agent to fetch the content of the URL to enhance the results.',
      {
        query: z.string().describe('The search query string.'),
        maxResults: z
          .number()
          .int()
          .positive()
          .optional()
          .default(5)
          .describe(
            'Maximum number of distinct results to return (default: 5).'
          ),
        page: z
          .number()
          .int()
          .min(0)
          .optional()
          .default(0)
          .describe(
            'Page number of results to return (0-indexed, default: 0).'
          ),
      },
      async ({
        query,
        maxResults,
        page,
      }: {
        query: string;
        maxResults?: number;
        page?: number;
      }) => {
        const client = liteClient(ALGOLIA_APP_ID, ALGOLIA_SEARCH_ONLY_KEY);
        try {
          const response = await client.searchForHits<Record<string, unknown>>({
            requests: [
              {
                indexName: ALGOLIA_INDEX_NAME,
                query: query,
                hitsPerPage: maxResults,
                page: page,
                distinct: true,
                attributesToRetrieve: [
                  'title',
                  'heading',
                  'relativeUrl',
                  'text',
                  'docType',
                  'parentID',
                  'objectID',
                  'isExternal',
                ],
              },
            ],
          });

          const firstResult = response.results[0];
          const hits = (firstResult?.hits || []) as Hit[];

          const cleanedHits = hits.map((hit) => {
            delete hit._highlightResult;
            return hit;
          });

          return {
            content: [
              {type: 'text', text: JSON.stringify(cleanedHits, null, 2)},
            ],
          };
        } catch (error) {
          console.error('Algolia search error:', error);
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          return {
            content: [
              {
                type: 'text',
                text: `Error searching lit.dev docs: ${errorMessage}`,
              },
            ],
            isError: true,
          };
        }
      }
    );
  },
};
