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
      // recommended: 'recommended',
    },
    messages: {
      'no-kevin': `No Kevin's allowed`,
    },
    type: 'problem',
    schema: [],
  },
  defaultOptions: [] as ReadonlyArray<unknown>,
});
