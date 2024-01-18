/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ESLintUtils} from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name: string) => `https://lit.dev/eslint/${name}`
);

// A rule that doesn't require a TypeScript program
export const noKevin = createRule({
  create(context) {
    console.log('create no-kvein');
    return {
      VariableDeclaration(node) {
        console.log('VariableDeclaration', node);
      },
      VariableDeclarator(node) {
        console.log('VariableDeclarator', node);
      },
      Identifier(node) {
        console.log('Identifier', node);
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
      recommended: 'recommended',
    },
    messages: {
      'no-kevin': `No Kevins allowed`,
    },
    type: 'problem',
    schema: [],
  },
  defaultOptions: [] as ReadonlyArray<unknown>,
});
