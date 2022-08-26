import {FileTree} from '@lit-labs/gen-utils/lib/file-utils.js';
import {Language} from '../../../commands/init.js';

export const generatePackage = (
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
    "serve": "wds --node-resolve -onw"${
      language !== 'ts'
        ? ''
        : `,
    "build": "tsc",
    "build:watch": "tsc --watch",
    "dev": "npm run serve & npm run build:watch"`
    }
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/<USERNAME>/${elementName}.git"
  },
  "keywords": [
    "web-components",
    "lit-element",
    "javascript",
    "typescript",
    "lit"
  ],
  "author": "<YOUR NAME>",
  "license": "BSD-3-Clause",
  "bugs": {
    "url": "https://github.com/<USERNAME>>/${elementName}/issues"
  },
  "homepage": "https://github.com/<USERNAME>>/${elementName}#readme",
  "dependencies": {
    "lit": "^2.3.0"
  },
  "devDependencies": {
    "@web/dev-server": "^0.1.32"${
      language !== 'ts'
        ? ''
        : `,
    "tslib": "^2.4.0",
    "typescript": "^4.7.4"`
    }
  },
  "exports": {
    "./lib/${elementName}.js": {
      "default": "./lib/${elementName}.js"
    }
  }
}`,
  };
};
