# @lit-labs/tsserver-plugin

TypeScript Language Service Plugin for Lit

> [!WARNING]
>
> This package is part of [Lit Labs](https://lit.dev/docs/libraries/labs/). It
> is published in order to get feedback on the design and may receive breaking
> changes or stop being supported.
>
> Please read our [Lit Labs documentation](https://lit.dev/docs/libraries/labs/)
> before using this library in production.

## Overview

A new TypeScript Language Service Plugin for Lit living in the Lit monorepo.

### Goals

This plugin will provide additional type-checking, syntax checking, and better errors for Lit constructs (like lit-html templates) that the TypeScript compiler can't check natively.

It is intended to include much of the functionality from [ts-lit-plugin](https://github.com/runem/lit-analyzer/tree/master/packages/ts-lit-plugin) and [eslint-plugin-lit](https://github.com/43081j/eslint-plugin-lit) but maintained within the Lit monorepo and based on the analysis of the [Lit team's first-party analyzer](https://github.com/lit/lit/tree/main/packages/labs/analyzer).

This plugin is also intended to be used with and be coherent with the new type-aware version of the `eslint-plugin-lit` library that's being developed (also int he Lit monorepo).

This means that additional checks should ideally live in either the linter or the type-checker, and rarely both. That may be hard as there is a blurry line between type-checking and type-aware linting, and not all users may want to run both tools. If there are cases where a rule exists in booth tools they should share an implementation, name, and ideally a controlling configuration.

### Features to include

Aside from linting / type-checking:

1. Syntax highlighting for lit-html templates and CSS
2. Jump-to-definition for custom elements
3. Hover-over docs for element attributes, properties, and events
4. Code completion for element names, attribute, properties, and events
5. Auto-import of elements
6. Rename support for element names, attribute, properties, and events
7. Snippets like a LitElement scaffold, HTMLElementTagNameMap entry, etc.

## Contributing

Please see [CONTRIBUTING.md](../../../CONTRIBUTING.md).

### Debugging

```sh
cd packages/labs/tsserver-plugin

# To hook up a debugger, use this command to have the TSServer wait till
# you attach with the "Attach to VS Code TS Server via Port" launch task.
TSS_DEBUG_BRK=9559 code example

# or use this to hook in later:
TSS_DEBUG=9559 code example
```
