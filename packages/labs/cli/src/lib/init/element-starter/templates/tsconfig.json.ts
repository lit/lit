/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {FileTree} from '@lit-labs/gen-utils/lib/file-utils.js';

export const generateTsconfig = (): FileTree => {
  return {
    'tsconfig.json': `{
  "compilerOptions": {
    "target": "es2022",
    "module": "es2022",
    "lib": ["es2022", "DOM", "DOM.Iterable"],
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "inlineSources": true,
    "rootDir": "src",
    "outDir": "lib",
    "strict": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "experimentalDecorators": true,
    "useDefineForClassFields": false
  },
  "include": ["src/**/*.ts"]
}`,
  };
};
