/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ESLintUtils} from '@typescript-eslint/utils';
import ts from 'typescript';
// import fs from 'fs';
// import path from 'path';

const createRule = ESLintUtils.RuleCreator(
  (name: string) => `https://lit.dev/eslint/${name}`
);

const lastMods = new Map<string, ts.SourceFile>();

// A rule that does need a TypeScript program
export const noStrings = createRule({
  create(context) {
    const services = ESLintUtils.getParserServices(context);
    services.program.getSourceFiles().forEach((m) => {
      console.log('Mod:', m.fileName, lastMods.get(m.fileName) === m);
      lastMods.set(m.fileName, m);
    });
    // console.log(`Program info:
    //   \trootFileNames: ${services.program.getRootFileNames()}
    //   \tconfigFile: ${services.program.getCompilerOptions().configFilePath}
    //   \tackageJson.name: ${
    //     (
    //       JSON.parse(
    //         fs.readFileSync(
    //           path.join(
    //             path.dirname(
    //               services.program.getCompilerOptions().configFilePath as string
    //             ),
    //             'package.json'
    //           ),
    //           'utf-8'
    //         )
    //       ) as {name: string}
    //     ).name
    //   }
    //   `);
    return {
      VariableDeclaration(node) {
        console.log('VariableDeclaration', node);
      },
      VariableDeclarator(node) {
        console.log('VariableDeclarator', node);
      },
      TSStringKeyword(node) {
        context.report({
          messageId: 'no-strings',
          node,
        });
      },
    };
  },
  name: 'no-strings',
  meta: {
    docs: {
      description: `Don't use strings`,
      recommended: 'recommended',
    },
    messages: {
      'no-strings': `No strings allowed`,
    },
    type: 'problem',
    schema: [],
  },
  defaultOptions: [] as ReadonlyArray<unknown>,
});
