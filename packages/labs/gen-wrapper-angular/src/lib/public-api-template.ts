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
  return (
    `/* eslint-disable import/extensions */\n` +
    litModules
      .map(({module, declarations}) => {
        const modulePath = path
          .relative('src', module.sourcePath)
          .replace(/\\/g, '/')
          .replace(/\.ts$/, '');
        const componentNames = declarations.map((d) => d.name).join(', ');
        return `export { ${componentNames} } from './${modulePath}';`;
      })
      .join('\n')
  );
};
