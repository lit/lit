# @lit/ts-transformers

[npm-img]: https://img.shields.io/npm/v/@lit/ts-transformers
[npm-href]: https://www.npmjs.com/package/@lit/ts-transformers
[test-img]: https://github.com/lit/lit/workflows/Tests/badge.svg?branch=main
[test-href]: https://github.com/lit/lit/actions?query=workflow%3ATests+branch%3Amain+event%3Apush

[![Published on NPM][npm-img]][npm-href]
[![Test status][test-img]][test-href]

TypeScript transformers for the [Lit decorators](https://lit.dev/docs/components/decorators/).

## Install

```sh
npm i @lit/ts-transformers
```

## Transformers

### idiomaticDecoratorsTransformer

```ts
import {idiomaticDecoratorsTransformer} from '@lit/ts-transformers';
```

Replaces all of the official [Lit class and property
decorators](https://lit.dev/docs/components/decorators/) with idiomatic vanilla
JavaScript.

Must run as a **`before`** transformer.

#### Example input

```ts
import {LitElement, html} from 'lit';
import {customElement, property} from 'lit/decorators.js';

@customElement('simple-greeting')
class SimpleGreeting extends LitElement {
  @property()
  name = 'World';

  render() {
    return html`<p>Hello ${this.name}!</p>`;
  }
}
```

#### Example output

```ts
import {LitElement, html} from 'lit';

class SimpleGreeting extends LitElement {
  static properties = {
    str: {},
  };

  constructor() {
    super();
    this.name = 'World';
  }

  render() {
    return html`Hello ${this.name}!`;
  }
}
customElements.define('simple-greeting', SimpleGreeting);
```

#### Supported decorators

| Decorator                | Transformer behavior                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------- |
| `@customElement`         | Adds a `customElements.define` call                                                   |
| `@property`              | Adds an entry to `static properties`, and moves initializers to the `constructor`     |
| `@state`                 | Same as `@property` with `{state: true}`                                              |
| `@query`                 | Defines a getter that calls `querySelector`                                           |
| `@querySelectorAll`      | Defines a getter that calls `querySelectorAll`                                        |
| `@queryAsync`            | Defines an `async` getter that awaits `updateComplete` and then calls `querySelector` |
| `@queryAssignedElements` | Defines a getter that calls `querySelector('slot[name=foo]').assignedElements`        |
| `@queryAssignedNodes`    | Defines a getter that calls `querySelector('slot[name=foo]').assignedNodes`           |
| `@localized`             | Adds an `updateWhenLocaleChanges` call to the constructor                             |

### preserveBlankLinesTransformer

```ts
import {
  preserveBlankLinesTransformer,
  BLANK_LINE_PLACEHOLDER_COMMENT,
  BLANK_LINE_PLACEHOLDER_COMMENT_REGEXP,
} from '@lit/ts-transformers';
```

A readability transformer that replaces blank lines in the original source with
a special comment, because TypeScript does not otherwise preserve blank lines
when it emits (see
[TypeScript#843](https://github.com/microsoft/TypeScript/issues/843)).

The comment is always exactly:

```ts
//__BLANK_LINE_PLACEHOLDER_G1JVXUEBNCL6YN5NFE13MD1PT3H9OIHB__
```

Must run as a **`before`** transformer, and should usually placed in front of
all other transformers.

### constructorCleanupTransformer

```ts
import {constructorCleanupTransformer} from '@lit/ts-transformers';
```

A readability transformer that does the following:

1. Moves constructors back to their original source position, or below the last
   `static` field if they are fully synthetic. By default, constructors will move
   to the top of a class whenever they are modified by TypeScript.

2. Simplifies `super(...)` calls to `super()` in class constructors, unless the
   class has any super-classes with constructors that takes parameters according
   to the type-checker.

Must run as an **`after`** transformer.

## Usage

There are a number of ways to compile a TypeScript program with transformers.

### TypeScript compiler API

If you are using the [TypeScript compiler
API](https://github.com/microsoft/TypeScript-wiki/blob/master/Using-the-Compiler-API.md)
directly, pass the transformer to the `customTransformers` parameter of `emit`.

Example:

```ts
import ts from 'typescript';

import {
  idiomaticDecoratorsTransformer,
  preserveBlankLinesTransformer,
  constructorCleanupTransformer,
} from '@lit/ts-transformers';

// Note this is not a complete example. For more information see
// https://github.com/microsoft/TypeScript-wiki/blob/master/Using-the-Compiler-API.md
const program = ts.createProgram(...);
const result = program.emit(undefined, undefined, undefined, undefined, {
  before: [
    // Optionally preserve blank lines for better readability.
    preserveBlankLinesTransformer(),

    // Transform Lit decorators to idiomatic vanilla JavaScript.
    idiomaticLitDecoratorTransformer(program),
  ],
  after: [
    // Optional readability improvements for constructors.
    constructorCleanupTransformer(program),
  ],
});
```

### ttypescript / ts-patch

[ttypescript](https://github.com/cevek/ttypescript#readme) and
[ts-patch](https://github.com/nonara/ts-patch#readme) are two similar tools that
augment the TypeScript compiler, adding the ability to declare transforms in
your `tsconfig.json`.

Example:

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "transform": "@lit/ts-transformers",
        "import": "preserveBlankLinesTransformer"
      },
      {
        "transform": "@lit/ts-transformers",
        "import": "idiomaticDecoratorsTransformer"
      },
      {
        "transform": "@lit/ts-transformers",
        "import": "constructorCleanupTransformer",
        "after": true
      }
    ]
  }
}
```

If `preserveBlankLinesTransformer` is used, one way to remove blank line
placeholder comments is with sed:

```bash
sed -i $'s/\s*\/\/__BLANK_LINE_PLACEHOLDER_G1JVXUEBNCL6YN5NFE13MD1PT3H9OIHB__/\\\n/g' lib/*.js lib/**/*.js
```

### @rollup/plugin-typescript

[@rollup/plugin-typescript](https://github.com/rollup/plugins/tree/master/packages/typescript/#readme)
is a [Rollup](https://rollupjs.org/) plugin for compiling TypeScript that includes support for transformers.

Example:

```ts
import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';

import {
  idiomaticDecoratorsTransformer,
  preserveBlankLinesTransformer,
  constructorCleanupTransformer,
  BLANK_LINE_PLACEHOLDER_COMMENT,
} from '@lit/ts-transformers';

export default {
  input: './src/my-element.ts',
  plugins: [
    typescript({
      transformers: {
        before: [
          // Optionally preserve blank lines for better readability.
          {factory: preserveBlankLinesTransformer},

          // Transform Lit decorators to idiomatic vanilla JavaScript.
          {type: 'program', factory: idiomaticDecoratorsTransformer},
        ],
        after: [
          // Optional readability improvements for constructors.
          {type: 'program', factory: constructorCleanupTransformer},
        ],
      },
    }),

    // Only for when using preserveBlankLinesTransformer.
    replace({
      values: {
        [`//${BLANK_LINE_PLACEHOLDER_COMMENT}`]: '',
      },
      delimiters: ['', ''],
    }),

    resolve(),
  ],

  output: {
    file: 'dist/my-element.js',
    format: 'esm',
  },
};
```
