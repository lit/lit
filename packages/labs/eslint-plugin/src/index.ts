/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ESLintUtils} from '@typescript-eslint/utils';
import ts from 'typescript';
import fs from 'fs';
import path from 'path';

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
      console.log(`Program info:
      \trootFileNames: ${services.program.getRootFileNames()}
      \tconfigFile: ${services.program.getCompilerOptions().configFilePath}
      \tackageJson.name: ${
        (
          JSON.parse(
            fs.readFileSync(
              path.join(
                path.dirname(
                  services.program.getCompilerOptions().configFilePath as string
                ),
                'package.json'
              ),
              'utf-8'
            )
          ) as {name: string}
        ).name
      }
      `);
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
