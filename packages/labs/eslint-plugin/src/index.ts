/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ESLintUtils} from '@typescript-eslint/utils';
import ts from 'typescript';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://lit.dev/eslint/${name}`
);

const lastMods = new Map<string, ts.SourceFile>();

export const rules = {
  'no-kevin': createRule({
    create(context) {
      const services = ESLintUtils.getParserServices(context);
      services.program.getSourceFiles().forEach((m) => {
        // console.log('Mod:', m.fileName, lastMods.get(m.fileName) === m);
        lastMods.set(m.fileName, m);
      });
      return {
        Identifier(node) {
          if (node.name.toLowerCase() === 'kevin') {
            context.report({
              messageId: 'no-kevin',
              node,
            });
          }
        },
      };
    },
    name: 'no-kevin',
    meta: {
      docs: {
        description: `Don't name things Kevin`,
        recommended: 'warn',
      },
      messages: {
        'no-kevin': `No Kevin's allowed`,
      },
      type: 'problem',
      schema: [],
    },
    defaultOptions: [],
  }),
};

export const configs = {
  all: {
    plugins: ['@lit-labs/eslint-plugin'],
    rules: {
      '@lit-labs/no-kevin': 'error',
    },
  },
};
