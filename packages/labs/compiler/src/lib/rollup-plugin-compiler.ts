/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {Plugin, TransformResult} from 'rollup';
import ts from 'typescript';
import {compileLitTemplates} from './template-transform.js';

export default function TemplateCompiler(): Plugin {
  return {
    name: 'lit-compiler',

    transform(code: string, _id: string): TransformResult {
      // TODO: What compiler options should be provided for a JavaScript file where
      // we want to make minimal changes.
      const result = ts.transpileModule(code, {
        compilerOptions: {
          target: ts.ScriptTarget.Latest,
          module: ts.ModuleKind.ESNext,
          sourceMap: true,
        },
        transformers: {before: [compileLitTemplates()]},
      });

      return {
        code: result.outputText,
        map: result.sourceMapText,
      };
    },
  };
}
