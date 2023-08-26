# @lit-labs/analyzer

A static analyzer for Lit

## Overview

This package contains static analysis utilities for analyzing source code that contain Lit templates and elements, that might be useful for other programs like linters, IDE plugins, code generators, etc.

This is a very early stage Lit Labs package and is not ready for use.

## Usage

_This section is incomplete_

### Node

```ts
import {createPackageAnalyzer} from '@lit-labs/analyzer/package-analyzer.js';
import * as path from 'path';

const packagePath = path.resolve('./my-package');
const analyzer = createPackageAnalyzer(packagePath);
const module = analyzer.getModule(
  path.resolve(packagePath, 'src/my-element.ts')
);
```

### Browser

You must use a bundler to bundle TypeScript, such as Rollup with the CommonJS plugin.

With `@rollup/plugin-commonjs` you need to ignore built-in libraries like `os`, `fs`, etc. You can isgnore these in your Rollup config:

rollup.config.js:

```ts
import commonjs from '@rollup/plugin-commonjs';

// ...
    plugins: [
      commonjs({
          ignore: (id) => ['fs', 'os', 'inspector'].includes(id),
      }),
    ],
// ...
```

You may need to install the `'path'` package:

```sh
npm i path
```

Then you can make an Analyzer using these imports:

```ts
import {Analyzer} from '@lit-labs/analyzer/lib/analyzer.js';
import {AbsolutePath} from '@lit-labs/analyzer/lib/paths.js';
import ts from 'typescript';
import * as path from 'path';

// TODO: show constructing an Analyzer in browser contexts
```

## Contributing

Please see [CONTRIBUTING.md](../../../CONTRIBUTING.md).
