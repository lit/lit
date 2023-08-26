# @lit-labs/ssr

A package for server-side rendering Lit templates and components.

## Status

`@lit-labs/ssr` is pre-release software, not quite ready for public consumption. As we develop it we are using it as a test bed to ensure that new versions of `lit` (`lit-html` and `lit-element`) are SSR-ready. We expect that the foundational SSR support in this package will support a wide variety of use cases, from full-blown app rendering frameworks built on top of web components, to framework-specific plugins for rendering custom elements in e.g. React or Angular, to pre-rendering plugins for static site generators like 11ty. Please stay tuned and file issues with use cases you'd like to see covered.

## Server Usage

### Rendering in the Node.js global scope

The easiest way to get started is to import your Lit template modules (and any
`LitElement` definitions they may use) into the node global scope and render
them to a stream (or string) using the `render(value: unknown): Iterable<string>` function provided by the `render-lit-html.js` module. When
running in Node, Lit automatically depends on Node-compatible implementations of
a minimal set of DOM APIs provided by the `@lit-labs/ssr-dom-shim` package,
including defining `customElements` on the global object.

```js
// Example: server.js:

import {render} from '@lit-labs/ssr/lib/render-lit-html.js';
import {myTemplate} from './my-template.js';

//...

const ssrResult = render(myTemplate(data));
context.body = Readable.from(ssrResult);
```

### Rendering in a separate VM context

To avoid polluting the Node.js global object with the DOM shim and ensure each request receives a fresh global object, we also provide a way to load app code into, and render from, a separate VM context with its own global object. _Note that using this feature requires Node 14+ and passing the `--experimental-vm-modules` flag to node on because of its use of [experimental VM modules](https://nodejs.org/api/vm.html#vm_class_vm_sourcetextmodule) for creating a module-compatible VM context._

To render in a VM context, the `renderModule` function from the
`render-module.js` module will import a given module into a server-side VM
context shimmed with the minimal DOM shim required for Lit server rendering,
execute a given function exported from that module, and return its value.

Within that module, you can call the `render` method from the
`render-lit-html.js` module to render `lit-html` templates and return an
iterable that incrementally emits the serialized strings of the given template.

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

import {renderModule} from '@lit-labs/ssr/lib/render-module.js';

// Execute the above `renderTemplate` in a separate VM context with a minimal DOM shim
const ssrResult = await (renderModule(
  './render-template.js',  // Module to load in VM context
  import.meta.url,         // Referrer URL for module
  'renderTemplate',        // Function to call
  [{some: "data"}]         // Arguments to function
) as Promise<Iterable<unknown>>);

// ...

context.body = Readable.from(ssrResult);
```

## Client usage

### Hydrating Lit templates

"Hydration" is the process of re-associating expressions in a template with the nodes they should update in the DOM. Hydration is performed by the `hydrate()` function from the `@lit-labs/ssr-client` module.

Prior to updating a server-rendered container using `render()`, you must first call `hydrate()` on that container using the same template and data that was used to render on the server:

```js
import {myTemplate} from './my-template.js';
import {render} from 'lit';
import {hydrate} from '@lit-labs/ssr-client';
// Initial hydration required before render:
// (must be same data used to render on the server)
const initialData = getInitialAppData();
hydrate(myTemplate(initialData), document.body);

// After hydration, render will efficiently update the server-rendered DOM:
const update = (data) => render(myTemplate(data), document.body);
```

### Hydrating LitElements

When `LitElement`s are server rendered, their shadow root contents are emitted inside a `<template shadowroot>`, also known as a [Declarative Shadow Root](https://web.dev/declarative-shadow-dom/), a new browser feature that is shipping in [most modern browsers](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template#browser_compatibility). Declarative shadow roots automatically attach their contents to a shadow root on the template's parent element when parsed. For browsers that do not yet implement declarative shadow root, there is a [`template-shadowroot`](https://github.com/webcomponents/template-shadowroot) polyfill, described below.

`hydrate()` does not descend into shadow roots - it only works on one scope of the DOM at a time. To hydrate `LitElement` shadow roots, load the `@lit-labs/ssr-client/lit-element-hydrate-support.js` module, which installs support for `LitElement` to automatically hydrate itself when it detects it was server-rendered with declarative shadow DOM. This module must be loaded before the `lit` module is loaded, to ensure hydration support is properly installed.

Put together, an HTML page that was server rendered and containing `LitElement`s in the main document might look like this:

```js
import {render} from '@lit-labs/ssr/lib/render-lit-html.js';
import './app-components.js';

const ssrResult = render(html`
  <html>
    <head> </head>
    <body>
      <app-shell>
        <app-page-one></app-page-one>
        <app-page-two></app-page-two>
      </app-shell>

      <script type="module">
        // Hydrate template-shadowroots eagerly after rendering (for browsers without
        // native declarative shadow roots)
        import {
          hasNativeDeclarativeShadowRoots,
          hydrateShadowRoots,
        } from './node_modules/@webcomponents/template-shadowroot/template-shadowroot.js';
        if (!hasNativeDeclarativeShadowRoots()) {
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

Note that as a simple example, the code above assumes a static top-level
template that does not need to be hydrated on the client, and that top-level
components individually hydrate themselves using data supplied either by
attributes or via a side-channel mechanism. This is in no way fundamental; the
top-level template can be used to pass data to the top-level components, and
that template can be loaded and hydrated on the client to apply the same data.

## Notes and limitations

Please note the following current limitations with the SSR package:

- **Browser support**: Support for hydrating elements on browsers that require the ShadyCSS polyfill (IE11) is not currently tested or supported.
- **DOM shim**: The DOM shim used by default is very minimal; because the server-rendering code for Lit relies largely on its declarative nature and string-based templates, we are able to incrementally stream the contents of a template and its sub-elements while avoiding the cost of a full DOM shim by not actually using the DOM for rendering. As such, the DOM shim used provides only enough to load and register element definitions, namely things like a minimal `HTMLElement` base class and `customElements` registry.
- **DOM access**: The above point means care should be taken to avoid interacting directly with the DOM in certain lifecycle callbacks. Concretely, you should generally only interact directly with the DOM (like accessing child/parent nodes, querying, imperatively adding event listeners, dispatching events, etc.) in the following lifecycle callbacks, which are not called on the server:
  - `LitElement`'s `update`, `updated`, `firstUpdated`, or event handlers
  - `Directive`'s `update`
- **Patterns for usage**: As mentioned above under "Status", we intend to flesh out a number of common patterns for using this package, and provide appropriate APIs and documentation for these as the package reaches maturity. Concerns like server/client data management, incremental loading and hydration, etc. are currently beyond the scope of what this package offers, but we believe it should support building these patterns on top of it going forward. Please [file issues](https://github.com/lit/lit/issues/new/choose) for ideas, suggestions, and use cases you may encounter.
