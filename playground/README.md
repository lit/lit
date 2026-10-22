# Playground

This is the `@lit-internal/playground` package. Inspired by (and
loosely compatible with) the
[Lit.dev playground](https://lit.dev/playground), it provides
an easy way to spin up small example projects that depend on the
monorepo's packages, for the purpose of testing, exploration,
demonstration, etc.

## Use cases

The monorepo playground is intended to support any use case
that benefits from having a live example running in a dev
server while working on monorepo packages. For example:

- Reproducing and fixing bugs
- Manual testing of behaviors that are difficult to test via
  automated tests alone
- Rapid iteration on alternatives when exploring new features

For some use cases, examples may be throw-aways, used during
local development and never committed; the playground includes
a `scratch` folder for this purpose. For other use cases, it may
be useful to commit examples to the repo, either temporarily or
permanently.

### Goals

- Make it easy and fast to spin up an example
- Provide an instant-feedback workflow, similar to the Lit.dev
  playground
- Support Gist-based import / export from the Lit.dev
  playground that that "just works" for common cases
- Establish a simple, flexible filesystem layout that allows
  examples to be committed to the repo when useful, while
  cleanly separating the playground implementation (scripts,
  templates, etc.) from individual examples

### Non-goals

- Editing / updating existing Lit.dev plaground examples
- 100% robust Lit.dev playground import and export

## Basic usage

Run the scripts below from the `playground` directory.

Note:

- Examples live in subfolders beneath `playground/p`
- When specifying the path to an example, you may include the
  leading `p/` for auto-complete, or omit for brevity
- If you don't intend to commit an example, you can put it
  beneath the `scratch` folder (`playground/p/scratch`) to
  make Git ignore it

### Create a new example

```
npm run new -- my-example
```

- Creates a new example (in this case, at
  `playground/p/my-example'`) by cloning a minimal template
- Alternatively, you can create an example from scratch,
  anywhere under `playground/p`

### Launch a dev server

```
npm run start -- my-demos/cool-demo
```

- Launches a dev server (with the root, in this case, at
  `playground/p/my-demos/cool-demo`)

### Import from a Gist

```
npm run import -- timer ee310ee9432d7a634852c8b9a56f95a9
```

- Creates a new example (in this case, at `playground/p/timer`)
  by importing from a Gist
- Second argument may be any string containing a 32-character,
  alphanumeric Gist ID (e.g., a Lit.dev playground URL)
- The import script constructs a `package.json`, derived from
  the Gist's original `package.json` (if any) and source files

### Export to a Gist

```
npm run export -- my-example
```

- Creates a new Gist from the specified example
- Requires manual installation of
  [this gist CLI](https://github.com/defunkt/gist)

## Details

### Live updates

- Changes to example source files will result in automatic,
  immediate HMR-based updates
- Changes to a Lit monorepo package generally require manual
  rebuilding of the package, with an update being triggered
  automatically upon completion of the build

### Example structure

- While the observance of certain conventions is useful for
  Lit.dev playground compatibility, there are essentially no
  special requirements or restrictions on how you build examples
- The dev server is launched with the example directory as its
  root
- If you don't need to export to a Gist, you can use subfolders to
  organize files
- The `index.html` file (if present) will be served if you
  browse to the server's localhost port without specifying a path
- If your example requires more structure, you can access other HTML
  files by path and/or use client-side routing
- JavaScript and TypeScript files can be used interchangeably, with
  TypeScript files being transpiled on the fly; when referring to
  script files, always use the `.js` extension, regardless of
  whether the source file is JavaScript or TypeScript
- Other subresources (CSS, images, fonts, etc.) may be loaded as
  usual, relative to the server root `/` or the referring file
  `./`
- Usage of Vite-specific features (loaders, etc.) is discouraged

### Dependencies

- If an example depends only on Lit monorepo packages, there is
  no need to include a `package.json` (though the template example
  does include an empty `package.json` for convenience)
- If an example depends on external packages or requires a specific
  released version of a Lit monorepo package, just add a
  `package.json` file and use the `npm` CLI directly in the example
  folder to manage and install dependencies

### Lit.dev playground compatibility

- Since Gists don't support nested folders, you should use a flat
  structure for any example you might want to export
- The Lit.dev playground expects a single HTML entrypoint, at
  `index.html`
- The Lit.dev playground supports implicit (undeclared)
  dependencies, but the monorepo playground does not (with the
  exception of Lit monorepo packages)
- The provided `import` script constructs a `package.json`, derived
  from the Gist's original `package.json` (if any) and source files
  - If the original `package.json` explicitly depends on any Lit
    monorepo packages, these dependencies are omitted from the
    constructed `package.json` so that they will be loaded from the
    current monorepo source instead
  - If the Gist's JavaScript or TypeScript source files import any
    modules from external packages that are not included in the
    Gist's `package.json`, these packages are added to the
    constructed `package.json` (though only top-level, static
    imports are detected)
- Upon successful completion, the `import` script writes a file
  named `_import.info.json` to the example folder, containing the
  source Gist ID and the contents of the Gist's original
  `package.json` file
- The `export` script requires manual installation of
  [this gist CLI](https://github.com/defunkt/gist)
- The `import` and `export` scripts do minimal error detection;
  they're designed to "just work" for common cases but don't
  enforce compliance with structural requirements and may be
  tripped up by edge cases

  ### Implementation details

- The `@lit-internal/playground` package is a workspace within
  the monorepo so that its dependencies (TypeScript and Vite)
  are installed via `npm install` at the monorepo root
- Individual examples are not workspaces; each example's
  external dependencies (if any) are installed locally
- Examples use the [Vite](https://vitejs.dev) dev server
  - Vite's `resolveId` hook makes it easier to support seamless
    import and export of examples from the Lit.dev playground
    (specifically, allowing `.ts` source files to be loaded from
    HTML files using `.js` file extensions—something that the
    Lit.dev playground requires but which isn't supported out of
    the box by either Vite or `@web/dev-server`).
  - Vite's transparent runtime TypeScript transpilation also
    appears to be more robust than `@web/dev-server`'s
  - Individual examples need not specify a dependency on Vite,
    provided that the dev server is launched from the
    `playground` directory using the provided NPM script
