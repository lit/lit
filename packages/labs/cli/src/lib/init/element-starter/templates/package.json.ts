/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {FileTree} from '@lit-labs/gen-utils/lib/file-utils.js';
import {Language} from '../../../commands/init.js';
import {litVersion} from '../../../lit-version.js';

export const generatePackageJson = (
  elementName: string,
  language: Language
): FileTree => {
  return {
    'package.json': `{
  "name": "${elementName}",
  "version": "0.0.1",
  "description": "A Minimal Lit Element starter kit",
  "type": "module",
  "main": "lib/${elementName}.js",
  "scripts": {
    "serve": "wds --node-resolve -nwo demo"${
      language !== 'ts'
        ? ''
        : `,
    "build": "tsc",
    "build:watch": "tsc --watch",
    "dev": "npm run serve & npm run build:watch"`
    }
  },
  "keywords": [
    "web-component",
    "lit-element",
    "lit"
  ],
  "dependencies": {
    "lit": "^${litVersion}"
  },
  "devDependencies": {
    "@web/dev-server": "^0.1.32"${
      language !== 'ts'
        ? ''
        : `,
    "typescript": "~5.2.0"`
    }
  },
  "exports": {
    "./lib/${elementName}.js": {
      "default": "./lib/${elementName}.js"
    }
  },
  "files": [
    "/lib"
  ]
}`,
  };
};
