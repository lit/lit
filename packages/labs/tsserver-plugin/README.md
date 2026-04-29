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

A TypeScript Language Service Plugin for Lit.

### Goals

This plugin provides additional type-checking, syntax checking, and better
errors for Lit constructs (like lit-html templates and LitElement subclasses)
than the TypeScript compiler can provide natively.

> [!NOTE]
>
> This package is intended to include most of the functionality from
> [ts-lit-plugin](https://github.com/runem/lit-analyzer/tree/master/packages/ts-lit-plugin)
> and [eslint-plugin-lit](https://github.com/43081j/eslint-plugin-lit) but
> maintained within the Lit monorepo and based on the analysis of the [Lit team's
> first-party
> analyzer](https://github.com/lit/lit/tree/main/packages/labs/analyzer).

This plugin is also intended to be used with and be coherent with the new
type-aware version of the `eslint-plugin-lit` library that's being developed
(also in the Lit monorepo).

This means that additional checks should ideally live in either the linter or
the type-checker, and rarely both. That may be hard as there is a blurry line
between type-checking and type-aware linting, and not all users may want to run
both tools. If there are cases where a rule exists in booth tools they should
share an implementation, name, and ideally a controlling configuration.

### Features to include

Aside from linting / type-checking:

1. Jump-to-definition for custom elements
2. Quick Info (hover-over docs) for element attributes, properties, and events
3. Code completion for element names, attribute, properties, and events
4. Auto-import of elements
5. Rename support for element names, attribute, properties, and events
6. Snippets like a LitElement scaffold, HTMLElementTagNameMap entry, etc.

## Contributing

Please see [CONTRIBUTING.md](../../../CONTRIBUTING.md).

### Running locally

There is an example project in `example/` that should be setup to run the plugin
locally for development.

The example project has a dependency on the plugin with a `file:..` version, and
a tsconfig that adds the plugin.

#### Install example project dependencies

```sh
cd packages/labs/tsserver-plugin/example
npm i
```

#### Open example project

```sh
cd packages/labs/tsserver-plugin
code example
```

#### Setup VS Code

Do these in the window that has the example project open:

- Make sure are using the TypeScript version from the example workspace. Click
  the `{}` from the status bar to select a version.
- The logs from the plugin are written to the TS Server logs. To see logs those,
  open a TypeScript file and run the command "TypeScript: Open TS Server log".
  You may have to enable the logs.
- Disable other Lit plugins.
  - Option 1: VS Code can not save disabled extensions to a workspace settings
    file, so you have to do this yourself. Go to the Extensions activity, click
    the gear icon next to `lit-plugin`, and select "Disable (Workspace)".
  - Option 2: Launch VS Code with the `--disable-extensions` flag as is done in
    `launch.json`

### Debugging

```sh
cd packages/labs/tsserver-plugin

# To hook up a debugger, use this command to have the TSServer wait till
# you attach with the "Attach to VS Code TS Server via Port" launch task.
TSS_DEBUG_BRK=9559 code example

# or use this to hook in later:
TSS_DEBUG=9559 code example
```
