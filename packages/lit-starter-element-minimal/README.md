# Lit Element minimal starter

This project includes a sample sharable component using Lit with JavaScript.

This template is generated from the `lit-starter-element-minimal` package in [the main Lit repo](https://github.com/lit/lit). Issues and PRs for this template should be filed in that repo.

## Setup

Install dependencies:

```bash
npm i
```

## Dev Server

This sample uses modern-web.dev's [@web/dev-server](https://www.npmjs.com/package/@web/dev-server) for previewing the project without additional build steps. Web Dev Server handles resolving Node-style "bare" import specifiers, which aren't supported in browsers. It also automatically transpiles JavaScript and adds polyfills to support older browsers. See [modern-web.dev's Web Dev Server documentation](https://modern-web.dev/docs/dev-server/overview/) for more information.

To run the dev server and open the project in a new browser tab:

```bash
npm run serve
```

There is a development HTML file located at `/index.html` that you can view at http://localhost:8000/index.html. Note that this command will serve your code using Lit's development mode (with more verbose errors).

## TypeScript

This starter kit is written in JavaScript, but offers a sample `tsconfig.json`. If you do not wish to develop in TypeScript, you may delete `tsconfig.json` with no impact to the setup. If you would like to convert this project to TypeScript, you can do so by running the following commands:

```bash
npm i -D typescript
npm i -s tslib
mkdir src
touch src/my-element.ts
echo "src" >> .npmignore
echo "lib" >> .gitignore
```

Then you may begin filling in the contents of `src/my-element.ts`. To build your TypeScript code, invoke the following command or add the `tsc` command to your `package.json` scripts:

```bash
npx tsc
```

To learn more about how to get started with TypeScript, see [TypeScript Development](https://lit.dev/docs/tools/development/#typescript). To learn more about developing Lit in TypeScript, see the [Lit documentation](https://lit.dev/docs) and make sure the code snippet slider is set to `TS`.

## Editing

If you use VS Code, we highly reccomend the [lit-plugin extension](https://marketplace.visualstudio.com/items?itemName=runem.lit-plugin), which enables some extremely useful features for lit-html templates:

- Syntax highlighting
- Type-checking
- Code completion
- Hover-over docs
- Jump to definition
- Linting
- Quick Fixes

The project is setup to reccomend lit-plugin to VS Code users if they don't already have it installed.

## Bundling and minification

This starter project doesn't include any build-time optimizations like bundling or minification. We recommend publishing components as unoptimized JavaScript modules, and performing build-time optimizations at the application level. This gives build tools the best chance to deduplicate code, remove dead code, and so on.

For information on building application projects that include LitElement components, see [Build for production](https://lit.dev/docs/tools/production/) on the LitElement site.

## More information

See [Get started](https://lit.dev/docs/getting-started/) on the Lit site for more information.
