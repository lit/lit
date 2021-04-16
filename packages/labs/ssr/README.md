# @lit-labs/ssr

A server package for rendering Lit templates and components on the server.

## Status

`@lit-labs/ssr` is pre-release software, not quite ready for public consumption. As we develop it we are using it as a test bed to ensure that new versions of `lit` (`lit-html` and `lit-element`) are SSR-ready. We expect that the foundational SSR support in this package will support a wide variety of use cases, from full-blown app rendering frameworks built on top of web components, to framework-specific plugins for rending custom elements in e.g. React or Angular, to pre-rendering plugins for static site generators like 11ty. Please stay tuned and file issues with use cases you'd like to see covered.

## Server Usage

### Rendering in the Node.js global scope

The easiest way to get started is to import your Lit template modules (and any `LitElement` definitions they may use) into the node global scope and render them to a stream (or string) using the `render(value: unknown): Iterable<string>` function provided by the `render-global.js` module. Since Lit-authored code may rely on DOM globals, the `render-global.js` module will install a minimal DOM shim into the nodejs global scope, which should be sufficient for typical use cases. As such, `render-global.js` should be imported before any modules containing Lit code.

```js
// Example: server.js:

import {render} from '@lit-labs/ssr/lib/render-global.js';
import {myTemplate} from './my-template.js';

//...

const ssrResult = render(myTemplate(data));
context.body = Readable.from(ssrResult);
```

### Sandboxed VM rendering

To avoid polluting the Node.js global object with the DOM shim and ensure each request receives a fresh global object, we also provide a way to load app code into, and render from, a separate VM context with its own global object. _Note that using this feature requires Node 14+ and passing the `--experimental-vm-modules` flag to node on because of its use of [experimental VM modules](https://nodejs.org/api/vm.html#vm_class_vm_sourcetextmodule) for creating a module-compatible VM sandbox._

To render in a VM context, the `renderModule` function from the
`render-module.js` module will import a given module into a server-side VM
sandbox shimmed with the minimal DOM shim required for Lit server rendering,
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

When `LitElement`s are server rendered, their shadow root contents are emitted inside a `<template shadowroot>`, also known as a [Declarative Shadow Root](https://web.dev/declarative-shadow-dom/), a new browesr feature that shipped in [Chrome 90](https://developer.chrome.com/blog/new-in-chrome-90/#declarative). Declarative shadow roots automatically attach their contents to a shadow root on the template's parent element when parsed. For browsers that do not yet implement declarative shadow root, there is a [`template-shadowroot`](https://github.com/webcomponents/template-shadowroot) ponyfill, described below.

Because the `hydrate` function above does not descend into shadow roots, it only works on one scope of the DOM at a time. To hydrate `LitElement` shadow roots, load the `lit/hydrate-support.js` module, which installs support for `LitElement` automatically hydrating itself when it detects it was server-rendered with declarative shadow DOM. This module should be loaded before the `lit` module is loaded, to ensure hydration support is properly installed.

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

## Notes and limitations

Please note the following current limitations with the SSR package:

- **Browser support**: Support for hydrating elements on browsers that require the ShadyCSS polyfill (IE11) is not currently tested or supported.
- **DOM shim**: The DOM shim used by default is very minimal; because the server-rendering code for Lit relies largely on its declarative nature and string-based templates, we are able to incrementally stream the contents of a template and its sub-elements while avoiding the cost of a full DOM shim by not actually using the DOM for rendering. As such, the DOM shim used provides only enough to load and register element definitions, namely things like a minimal `HTMLElement` base class and `customElements` registry.
- **DOM access**: The above point means care should be taken to avoid interacting directly with the DOM in certain lifecycle callbacks. Concretely, you should generally only interact directly with the DOM (like accessing child/parent nodes, querying, imperatively adding event listeners, dispatching events, etc.) in the following lifecycle callbacks, which are not called on the server:
  - `LitElement`'s `update`, `updated`, `firstUpdated`, or event handlers
  - `Directive`'s `update`
- **Patterns for usage**: As mentioned above under "Status", we intend to flesh out a number of common patterns for using this package, and provide appropriate APIs and documentation for these as the package reaches maturity. Concerns like server/client data management, incremental loading and hydration, etc. are currently beyond the scope of what this package offers, but we believe it should support building these patterns on top of it going forwrad. Please [file issues](https://github.com/Polymer/lit-html/issues/new/choose) for ideas, suggestions, and use cases you may encounter.
