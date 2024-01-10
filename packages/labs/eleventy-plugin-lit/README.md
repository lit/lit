# @lit-labs/eleventy-plugin-lit

<img src="11ty-lit.svg" alt="Eleventy + Lit" height="150">

A plugin for [Eleventy](https://www.11ty.dev) that pre-renders
[Lit](https://lit.dev/) web components at build time, with optional hydration.

[![Build Status](https://github.com/lit/lit/actions/workflows/tests.yml/badge.svg)](https://github.com/lit/lit/actions/workflows/tests.yml)
[![Published on npm](https://img.shields.io/npm/v/@lit-labs/eleventy-plugin-lit.svg?logo=npm)](https://www.npmjs.com/package/@lit-labs/eleventy-plugin-lit)

## Contents

- [Status](#status)
- [Setup](#setup)
  - [Install](#install)
  - [Register plugin](#register-plugin)
  - [Configure component modules](#configure-component-modules)
  - [Enable experimental VM modules](#enable-experimental-vm-modules)
  - [Watch mode](#watch-mode)
- [Usage](#usage)
  - [Component compatibility](#component-compatibility)
  - [Passing data to components](#passing-data-to-components)
- [Declarative Shadow DOM](#declarative-shadow-dom)
  - [Polyfill](#polyfill)
- [Hydration](#hydration)
- [Bootup](#bootup)
  - [Example bootup strategy](#example-bootup-strategy)
- [Roadmap](#roadmap)
- [Issues and comments](#issues-and-comments)
- [Contributing](#contributing)

## Status

🚧 `@lit-labs/eleventy-plugin-lit` is part of the [Lit
Labs](https://lit.dev/docs/libraries/labs/) set of packages - it is published in
order to get feedback on the design and not ready for production. Breaking
changes are likely to happen frequently. 🚧

## Setup

### Install

```sh
npm i @lit-labs/eleventy-plugin-lit
```

### Register plugin

Edit your `.eleventy.js` config file to register the Lit plugin:

<!-- prettier-ignore-start -->
```js
const litPlugin = require('@lit-labs/eleventy-plugin-lit');

module.exports = function (eleventyConfig) {
  eleventyConfig.addPlugin(litPlugin, {
    mode: 'worker',
    componentModules: [
      'js/demo-greeter.js',
      'js/other-component.js',
    ],
  });
};
```
<!-- prettier-ignore-end -->

### Configure mode

Use the `mode` setting to tell the plugin which mode to use for rendering.
The plugin currently supports either `'worker'` or `'vm'`.

`'worker'` mode (default) utilizes
[worker threads](https://nodejs.org/api/worker_threads.html#worker-threads)
to render components in isolation.

`'vm'` mode utilizes [`vm.Module`](https://nodejs.org/api/vm.html#class-vmmodule)
for context isolation and therefore eleventy _must_ be executed with the
`--experimental-vm-modules` Node flag enabled. This flag is available in
Node versions `12.16.0` and above.

```sh
NODE_OPTIONS=--experimental-vm-modules eleventy
```

### Configure component modules

> 🚧 Note: Support for specifying component modules in Eleventy front matter is
> on the [roadmap](#roadmap). Follow
> [#2494](https://github.com/lit/lit/issues/2483) for progress and discussion. 🚧

Use the `componentModules` setting to tell the plugin where to find the
definitions of your components.

Pass an array of paths to `.js` files containing Lit component definitions.
Paths are interpreted relative to to the directory from which the `eleventy`
command is executed.

Each `.js` file should be a JavaScript module (ESM) that imports `lit` with a
bare module specifier and defines a component with `customElements.define`.

Note that in `'worker'` mode, Node determines the module system
[accordingly](https://nodejs.org/api/packages.html#determining-module-system),
and as such care must be taken to ensure Node reads them as ESM files
while still reading the eleventy config file as CommonJS.

Some options are:

1. Add `{"type": "module"}` to your base `package.json`, make sure the
   eleventy config file ends with the `.cjs` extension, and supply it as
   a command line argument to `eleventy`.

   ```sh
   eleventy --config=.eleventy.cjs
   ```

1. Put all component `.js` files in a subdirectory with a nested `package.json` with
   `{"type": "module"}`.

### Watch mode

Use [`addWatchTarget`](https://www.11ty.dev/docs/watch-serve/) to tell Eleventy
to watch for changes in your JavaScript directory:

```js
eleventyConfig.addWatchTarget('js/');
```

## Usage

Whenever you use a custom element in your Eleventy Markdown and HTML files,
`@lit-labs/eleventy-plugin-lit` will automatically render its template and
styles directly into your HTML.

For example, given a markdown file `hello.md`:

```md
# Greetings

<demo-greeter name="World"></demo-greeter>
```

And a component definition `js/demo-greeter.js`:

<!-- prettier-ignore-start -->
```js
import {LitElement, html, css} from 'lit';

class DemoGreeter extends LitElement {
  static styles = css`
    b { color: red; }
  `;

  static properties = {
    name: {},
  };

  render() {
    return html`Hello <b>${this.name}</b>!`;
  }
}
customElements.define('demo-greeter', DemoGreeter);
```
<!-- prettier-ignore-end -->

Then the Eleventy will produce `greeting/index.html`:

<!-- prettier-ignore-start -->
```html
<h1>Greetings</h1>

<demo-greeter name="World">
  <template shadowroot="open">
    <style>
      b { color: red; }
    </style>
  </template>
  Hello <b>World</b>!
</demo-greeter>
```
<!-- prettier-ignore-end -->

The `<template shadowroot="open">` element above is an HTML standard called
declarative shadow DOM. See the [Declarative Shadow
DOM](#declarative-shadow-dom) section below for more details.

### Component compatibility

> 🚧 Note: Expanding this section with full details on component compatibility
> is on the [roadmap](#roadmap). Follow
> [#2494](https://github.com/lit/lit/issues/2494) for progress and discussion.
> 🚧

There are currently a number of restrictions that determine whether a component
will be compatible with Lit pre-rendering, because not all of the component
lifecycle methods are currently invoked, and the DOM APIs that can be used in
certain lifecycle methods are restricted.

The Lit team is working on finalizing and documenting the SSR lifecycle and
restrictions, follow [#2494](https://github.com/lit/lit/issues/2494) for more
details.

### Passing data to components

> 🚧 Note: Support for passing data as properties is on the [roadmap](#roadmap).
> Follow [#2494](https://github.com/lit/lit/issues/2485) for progress and
> discussion. 🚧

Data can be passed to your components by setting attributes (see the `name`
attribute in the [example](#usage) above), or passing child elements.

## Declarative Shadow DOM

Lit SSR depends on _[Declarative Shadow
DOM](https://web.dev/declarative-shadow-dom/)_, a browser feature that allows
Shadow DOM to be created and attached directly from HTML, without the use of
JavaScript.

### Polyfill

As of February 2022, Chrome and Edge have native support for Declarative Shadow
DOM, but Firefox and Safari don't yet.

Therefore, unless you are developing for a very constrained environment, you
must use the [Declarative Shadow DOM
Polyfill](https://github.com/webcomponents/template-shadowroot) to emulate this
feature in browsers that don't yet support it.

Install the polyfill from NPM:

```sh
npm i @webcomponents/template-shadowroot
```

For usage, see the [example bootup strategy](#example-bootup-strategy) which
demonstrates a recommended method for efficiently loading the polyfill alongside
Lit hydration support.

> ⏱️ The Declarative Shadow DOM polyfill **must be applied after all
> pre-rendered HTML has been parsed**, because it is a one-shot operation. You
> can guarantee this timing by importing the polyfill from a `type=module`
> script, or by placing it at the end of your `<body>` tag.

Note that even if you do not require hydration, you will still need to polyfill
Declarative Shadow DOM, otherwise your pre-rendered components will never be
displayed in some browsers.

## Hydration

_Hydration_ is the process where statically pre-rendered components are upgraded
to their JavaScript implementations, becoming responsive and interactive.

Lit components can automatically hydrate themselves when they detect that a
Shadow Root has already been attached, as long as Lit's _experimental hydrate
support_ module has been installed by importing
[`@lit-labs/ssr-client/lit-element-hydrate-support.js`](https://github.com/lit/lit/blob/main/packages/labs/ssr-client/src/lit-element-hydrate-support.ts).

> ⏱️ The Lit hydration support module **must be loaded before Lit or any
> components that depend on Lit are imported**, because it modifies the initial
> startup behavior of the `lit-element.js` module and the `LitElement` class.

## Bootup

It is important to preserve some constraints when designing a boot-up strategy
for pages that use pre-rendered Lit components. In particular:

- The Declarative Shadow DOM polyfill must wait until all HTML has been parsed.
- Lit and Lit component definition modules must wait until the experimental Lit
  hydration support module has loaded.
- Lit component definition modules must wait until the Declarative Shadow DOM
  polyfill to have been invoked (if it was needed for the browser).

In the following diagram, each `->` edge represents a timing sequence
constraint:

```
parse    load       install lit
 HTML  polyfill   hydration support
  |       |        |
  v       v        v
 run polyfill    load lit
          |        |
          v        v
        load component
         definitions
```

### Example bootup strategy

> 🚧 Note: The pattern described here will only work in modern browsers such as
> Firefox, Chrome, Edge, and Safari. IE11 is also supported, but will require a
> different pattern that is not yet documented here. Documenting this pattern is
> on the [roadmap](#roadmap). Follow
> [#2494](https://github.com/lit/lit/issues/2486) for progress and discussion.
> 🚧

The following demonstrates an example strategy for booting up a page that
contains pre-rendered Lit components with Eleventy.

The Lit team is investigating ways to simplify this bootup strategy and help you
generate it. Follow [#2487](https://github.com/lit/lit/issues/2487) and
[#2490](https://github.com/lit/lit/issues/2490) for progress.

Typically in Eleventy your content is written in Markdown files which delegate
the outer HTML shell to a `layout`. For example `hello.md` could delegate to the
`default.html` layout like this:

```markdown
---
layout: default.html
---

# Greetings

<demo-greeter name="World"></demo-greeter>
```

The file `_includes/default.html` would then contain the following:

```html
<!DOCTYPE html>
<html>
  <head>
    <!-- As an optimization, immediately begin fetching the JavaScript modules
        that we know for sure we'll eventually need. It's important we don't
        execute them yet, though. -->
    <link
      rel="modulepreload"
      href="/node_modules/@lit-labs/ssr-client/lit-element-hydrate-support.js"
    />
    <link rel="modulepreload" href="/_js/component1.js" />
    <link rel="modulepreload" href="/_js/component2.js" />

    <!-- On browsers that don't yet support native declarative shadow DOM, a
         paint can occur after some or all pre-rendered HTML has been parsed,
         but before the declarative shadow DOM polyfill has taken effect. This
         paint is undesirable because it won't include any component shadow DOM.
         To prevent layout shifts that can result from this render, we use a
         "dsd-pending" attribute to ensure we only paint after we know
         shadow DOM is active. -->
    <style>
      body[dsd-pending] {
        display: none;
      }
    </style>
  </head>

  <body dsd-pending>
    <script>
      if (HTMLTemplateElement.prototype.hasOwnProperty('shadowRoot')) {
        // This browser has native declarative shadow DOM support, so we can
        // allow painting immediately.
        document.body.removeAttribute('dsd-pending');
      }
    </script>

    <!-- Pre-rendered Lit components will be generated here. -->
    {{ content }}

    <!-- At this point, browsers with native shadow DOM support will already
         be able to paint the initial fully styled state your components,
         without executing a single line of JavaScript! However, the components
         aren't interactive yet -- that's what hydration is for. -->

    <!-- Use a type=module script so that we can use dynamic module imports.
         Note this pattern will not work in IE11. -->
    <script type="module">
      (async () => {
        // Start fetching the Lit hydration support module (note the absence
        // of "await" -- we don't want to block yet).
        const litHydrateSupportInstalled = import(
          '/node_modules/@lit-labs/ssr-client/lit-element-hydrate-support.js'
        );

        // Check if we require the declarative shadow DOM polyfill. As of
        // February 2022, Chrome and Edge have native support, but Firefox
        // and Safari don't yet.
        if (!HTMLTemplateElement.prototype.hasOwnProperty('shadowRoot')) {
          // Fetch the declarative shadow DOM polyfill.
          const {hydrateShadowRoots} = await import(
            '/node_modules/@webcomponents/template-shadowroot/template-shadowroot.js'
          );

          // Apply the polyfill. This is a one-shot operation, so it is important
          // it happens after all HTML has been parsed.
          hydrateShadowRoots(document.body);

          // At this point, browsers without native declarative shadow DOM
          // support can paint the initial state of your components!
          document.body.removeAttribute('dsd-pending');
        }

        // The Lit hydration support module must be installed before we can
        // load any component definitions. Wait until it's ready.
        await litHydrateSupportInstalled;

        // Load component definitions. As each component definition loads, your
        // pre-rendered components will come to life and become interactive.
        //
        // You may also prefer to bundle your components into fewer JS modules.
        // See https://lit.dev/docs/tools/production/#building-with-rollup for
        // more details.
        import('/_js/component1.js');
        import('/_js/component2.js');
      })();
    </script>
  </body>
</html>
```

## Roadmap

The following features and fixes are on the roadmap for this plugin. See the
linked issues for more details, and feel free to comment on the issues if you
have any thoughts or questions.

- [[#2494](https://github.com/lit/lit/issues/2494)] Document restrictions on SSR
  compatible components.

- [[#2483](https://github.com/lit/lit/issues/2483)] Allow specifying component
  definition modules in [front
  matter](https://www.11ty.dev/docs/data-frontmatter/) instead of the
  [`componentModules`](#configure-component-modules) setting.

- [[#2485](https://github.com/lit/lit/issues/2485)] Provide a mechanism for
  passing [Eleventy data](https://www.11ty.dev/docs/data/) to components as
  _properties_, instead of attributes.

- [[#2486](https://github.com/lit/lit/issues/2486)] Patterns and documentation
  for supporting IE11.

- [[#2487](https://github.com/lit/lit/issues/2487)] Provide a mechanism for
  automatically generating and inserting an appropriate [hydration](#hydration)
  configuration.

- [[#2490](https://github.com/lit/lit/issues/2490)] Simplify and optimize the
  polyfill + hydration bootup strategy.

## Issues and comments

If you find any bugs in this package, please file an
[issue](https://github.com/lit/lit/issues). If you have any questions or
comments, start a [discussion](https://github.com/lit/lit/discussions).

## Contributing

Please see [CONTRIBUTING.md](../../../CONTRIBUTING.md).

### Testing environment variables:

- `SHOW_TEST_OUTPUT`: Set to show all `stdout` and `stderr` from spawned eleventy invocations in test cases.
