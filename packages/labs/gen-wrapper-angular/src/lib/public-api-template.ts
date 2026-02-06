/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ModuleWithLitElementDeclarations} from '@lit-labs/analyzer';
import * as path from 'path';

export const publicApiTemplate = (
  litModules: ModuleWithLitElementDeclarations[]
) => {
  return litModules
    .map(({module}) => {
      return `export * from './${path
        .relative('src', module.sourcePath)
        .replace(/\\/g, '/')
        .replace(/\.ts$/, '')}';`;
    })
    .join('\n');
};
