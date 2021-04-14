# @lit-labs/ssr

Lit SSR server

## Status

`@lit-labs/ssr` is pre-release software, not quite ready for public consumption. As we develop it we are using it as a test bed to ensure that the next versions of `lit` (`lit-html` and `lit-element`) are SSR-ready.

## Server Usage

### Rendering in the nodejs global scope

The easiest way to get started is to import your Lit template modules (and any `LitElement` definitions they may use) into the node global scope and render them to a stream (or string) using the `render(value: unknown): Iterable<string>` function provided by the `render-global.js` module. Since Lit-authored code may rely on DOM globals, the `render-global.js` module will install a minimal DOM shim into the nodejs global scope, which should be sufficient for typical use cases. As such, `render-global.js` should be imported before any modules containing Lit code.

Example:

```js
// Example: server.js:

import {render} from '@lit-labs/ssr/lib/render-global.js';
import {myTemplate} from './my-template.js';

//...

const ssrResult = render(myTemplate(data));
context.body = Readable.from(ssrResult);
```

### Sandboxed VM rendering

To avoid polluting the nodejs global scope with the DOM shim and/or ensure each request receives a fresh global scope, a sandboxed method of rendering is also provided. _Note that using this feature requires Node 14+ and passing the `--experimental-vm-modules` flag to node as it relies on because of its use of [experimental VM modules](https://nodejs.org/api/vm.html#vm_class_vm_sourcetextmodule) for creating a module-compatible VM sandbox._

To render in a VM sandbox, the `renderModule` function from the
`render-module.js` module will import a given module into a server-side VM
sandbox shimmed with the minimal DOM shim required for Lit server rendering,
execute a given function exported from that module, and return its value.

Within that module, you an call the `render` method from the
`render-lit-html.js` module to render `lit-html` templates and return an async
iterable that emits the serialized strings of the given template.

Example:

```js
// Example: render-template.js

import {render} from '@lit-labs/ssr/lib/render-lit-html.js';
import {myTemplate} from './my-template.js';
export const renderTemplate = (someData) => {
  return render(myTemplate(someData));
};
```

```js
// Example: server.js:

import {renderModule} from 'lit-ssr/lib/render-module.js';

// Execute the above `renderTemplate` in a sandboxed VM with a minimal DOM shim
const ssrResult = await (renderModule(
  './render-template.js',  // Module to load in SSR sandbox
  import.meta.url,         // Referrer URL for module
  'renderTemplate',        // Function to call
  [{some: "data"}]         // Arguments to function
) as Promise<Iterable<unknown>>);

// ...

context.body = Readable.from(ssrResult);
```

## Client usage

### Hydrating lit templates

In order to "hydrate" lit templates, which is the process of having lit re-associate the expressions of a lit template with which nodes they should update in the DOM, the `experimental-hydrate` module is provided in the `lit` package. Prior to updating a server-rendered container using `render`, you should first call `hydrate` on that container using the same template and data that was used to render on the server:

```js
import {myTemplate} from './my-template.js';
import {render, hydrate} from `lit/experimental-hydrate.js`;

// Initial hydration required before render:
const initialData = /* should be same data used to render on the server */;
hydrate(myTemplate(initialData), document.body);

// After hydration, render will efficiently update the server-rendered DOM:
const update = (data) => render(myTemplate(data), document.body);
```

### Hydrating LitElements

When `LitElement`s are server rendered, their shadow root is emitted to a `<template shadowroot>`, also known as a [Declarative Shadow Root](https://web.dev/declarative-shadow-dom/), a new browesr feature that shipped in [Chrome 90](https://developer.chrome.com/blog/new-in-chrome-90/#declarative). Declarative shadow roots automatically attach their contents to a shadow root on the parent Custom Element when parsed. For browsers that do not yet implement declarative shadow root, there is a [`template-shadowroot`](https://github.com/webcomponents/template-shadowroot) ponyfill, described below.

Because the `hydrate` function above does not descend into shadow roots, `hydrate` only works on one scope of the DOM. To hydrate `LitElement` shadow roots, load the `lit/hydrate-support.js` module, which installs support for `LitElement` automatically hydrating itself when it detects it was server-rendered with declarative shadow DOM. This module should be loaded before the `lit` module is loaded, to ensure hydration support is properly installed.

Put together, an HTML page that was server rendered and containing `LitElement`s in the main document might look like this:

```js
import {render} from '@lit-labs/ssr/lib/render-global.js';
import './app-components.js';

const ssrResult = render(html`
  <html>
    <head>
    </head>
    <body>

      <app-shell>
        <app-page-one></app-page-one>
        <app-page-two></app-page-two>
      </app-component>

      <script type="module">
        // Hydrate template-shadowroots eagerly after rendering (for browsers without
        // native declarative shadow roots)
        import {
          hasNativeDeclarativeShadowRoots,
          hydrateShadowRoots
        } from './node_modules/@webcomponents/template-shadowroot/template-shadowroot.js';
        if (!hasNativeDeclarativeShadowRoots) {
          hydrateShadowRoots(document.body);
        }
        // ...
        // Load and hydrate components lazily
        import('./app-components.js');
      </script>

    </body>
  </html>
`);

// ...

context.body = Readable.from(ssrResult);
```
