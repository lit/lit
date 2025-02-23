# @lit-labs/ssr

A package for server-side rendering Lit templates and components.

> [!WARNING]
>
> This package is part of [Lit Labs](https://lit.dev/docs/libraries/labs/). It
> is published in order to get feedback on the design and may receive breaking
> changes or stop being supported.
>
> Please read our [Lit Labs documentation](https://lit.dev/docs/libraries/labs/)
> before using this library in production.
>
> Documentation: https://lit.dev/docs/ssr/overview/
>
> Give feedback: https://github.com/lit/lit/discussions/3353

## Status

`@lit-labs/ssr` is pre-release software, not quite ready for public consumption.
If you try Lit SSR, please give feedback and file issues with bugs and use cases
you'd like to see covered.

## Server Usage

### Rendering in the Node.js global scope

The easiest way to get started is to import your Lit template modules (and any
`LitElement` definitions they may use) into the node global scope and render
them to a stream (or string) using the `render(value: unknown, renderInfo?: Partial<RenderInfo>): RenderResult` function provided by `@lit-labs/ssr`. When
running in Node, Lit automatically depends on Node-compatible implementations of
a minimal set of DOM APIs provided by the `@lit-labs/ssr-dom-shim` package,
including defining `customElements` on the global object.

#### Rendering to a stream

Web servers should prefer rendering to a stream, as they have a lower memory
footprint and allow sending data in chunks as they are being processed. For this
case use `RenderResultReadable`, which is a Node `Readable` stream
implementation that provides values from `RenderResult`. This can be piped
into a `Writable` stream, or passed to web server frameworks like [Koa](https://koajs.com/).

```js
// Example: server.js:

import {render} from '@lit-labs/ssr';
import {RenderResultReadable} from '@lit-labs/ssr/lib/render-result-readable.js';
import {myTemplate} from './my-template.js';

//...

const ssrResult = render(myTemplate(data));
// Assume `context` is a Koa.Context.
context.body = new RenderResultReadable(ssrResult);
```

#### Rendering to a string

To render to a string, you can use the `collectResult` or `collectResultSync` helper functions.

```js
import {render} from '@lit-labs/ssr';
import {
  collectResult,
  collectResultSync,
} from '@lit-labs/ssr/lib/render-result.js';
import {html} from 'lit';

const myServerTemplate = (name) => html`<p>Hello ${name}</p>`;
const ssrResult = render(myServerTemplate('SSR with Lit!'));

// Will throw if a Promise is encountered
console.log(collectResultSync(ssrResult));
// Awaits promises
console.log(await collectResult(ssrResult));
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

import {render} from '@lit-labs/ssr';
import {RenderResultReadable} from '@lit-labs/ssr/lib/render-result-readable.js';
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

// Assume `context` is a Koa.Context, or other API that accepts a Readable.
context.body = new RenderResultReadable(ssrResult);
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
import {html} from 'lit';
import {render} from '@lit-labs/ssr';
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

## Server-only templates

`@lit-labs/ssr` also exports an `html` template function, similar to the normal Lit `html` function, only it's used for server-only templates. These templates can be used for rendering full documents, including the `<!DOCTYPE html>`, and rendering into elements that Lit normally cannot, like `<title>`, `<textarea>`, `<template>`, and safe `<script>` tags like `<script type="text/json">`. They are also slightly more efficient than normal Lit templates, because the generated HTML doesn't need to include markers for updating.

Server-only templates can be composed, and combined, and they support almost all features that normal Lit templates do, with the exception of features that don't have a pure HTML representation, like event handlers or property bindings.

Server-only templates can only be rendered on the server, they can't be rendered on the client. However if you render a normal Lit template inside a server-only template, then it can be hydrated and updated. Likewise, if you place a custom element inside a server-only template, it can be hydrated and update like normal.

Here's an example that shows how to use a server-only template to render a full document, and then lazily hydrate both a custom element and a template:

```js
import {render, html} from '@lit-labs/ssr';
import {RenderResultReadable} from '@lit-labs/ssr/lib/render-result-readable.js';
import './app-shell.js';
import {getContent} from './content-template.js';

const pageInfo = {
  /* ... */
};

const ssrResult = render(html`
  <!DOCTYPE html>
  <html>
    <head><title>MyApp ${pageInfo.title}</head>
    <body>
      <app-shell>
        <!-- getContent is hydratable, as it returns a normal Lit template -->
        <div id="content">${getContent(pageInfo.description)}</div>
      </app-shell>

      <script type="module">
        // Hydrate template-shadowroots eagerly after rendering (for browsers without
        // native declarative shadow roots)
        import {
          hasNativeDeclarativeShadowRoots,
          hydrateShadowRoots,
        } from './node_modules/@webcomponents/template-shadowroot/template-shadowroot.js';
        import {hydrate} from '@lit-labs/ssr-client';
        import {getContent} from './content-template.js';
        if (!hasNativeDeclarativeShadowRoots()) {
          hydrateShadowRoots(document.body);
        }

        // Load and hydrate app-shell lazily
        import('./app-shell.js');

        // Hydrate content template. This <script type=module> will run after
        // the page has loaded, so we can count on page-id being present.
        const pageInfo = JSON.parse(document.getElementById('page-info').textContent);
        hydrate(getContent(pageInfo.description), document.querySelector('#content'));
        // #content element can now be efficiently updated
      </script>
      <!-- Pass data to client. -->
      <script type="text/json" id="page-info">
        ${JSON.stringify(pageInfo)}
      </script>
    </body>
  </html>
`);

// ...

context.body = new RenderResultReadable(ssrResult);
```

## Notes and limitations

Please note the following current limitations with the SSR package:

- **Browser support**: Support for hydrating elements on browsers that require the ShadyCSS polyfill (IE11) is not currently tested or supported.
- **DOM shim**: The DOM shim used by default is very minimal; because the server-rendering code for Lit relies largely on its declarative nature and string-based templates, we are able to incrementally stream the contents of a template and its sub-elements while avoiding the cost of a full DOM shim by not actually using the DOM for rendering. As such, the DOM shim used provides only enough to load and register element definitions, namely things like a minimal `HTMLElement` base class and `customElements` registry.
- **DOM access**: The above point means care should be taken to avoid interacting directly with the DOM in certain lifecycle callbacks. Concretely, you should generally only interact directly with the DOM (like accessing child/parent nodes, querying, etc.) in the following lifecycle callbacks, which are not called on the server:
  - `LitElement`'s `update`, `updated`, `firstUpdated`
  - `Directive`'s `update`
- **Events**: The DOM shim implements basic event handling.
  - It is possible to register event handlers and to dispatch events, but only on custom elements.
  - Be aware that you cannot mutate a parent via events, due to the way we stream data via SSR. This means only a use case like `@lit/context` is supported, where events are used to pass data from a parent back to a child to use in its rendering.
  - The DOM tree is not fully formed and the `event.composedPath()` returns a simplified tree, only containing the custom elements.
  - As an alternative to `document.documentElement` or `document.body` (which are expected to be undefined in the server environment) for global event listeners (e.g. for `@lit/context ContextProvider`), you can use the global variable `globalThis.litServerRoot` which is (only) available during SSR (e.g. `new ContextProvider(isServer ? globalThis.litServerRoot : document.body, {...})`).
- **connectedCallback Opt-In**: We provide an opt-in for calling `connectedCallback`, which can be enabled via `globalThis.litSsrCallConnectedCallback = true;`. This will enable calling `connectedCallback` (and the `hostConnected` hook for controllers, but not the `hostUpdate` hook) on the server. This e.g. enables using `@lit/context` on the server.
- **Patterns for usage**: As mentioned above under "Status", we intend to flesh out a number of common patterns for using this package, and provide appropriate APIs and documentation for these as the package reaches maturity. Concerns like server/client data management, incremental loading and hydration, etc. are currently beyond the scope of what this package offers, but we believe it should support building these patterns on top of it going forward. Please [file issues](https://github.com/lit/lit/issues/new/choose) for ideas, suggestions, and use cases you may encounter.
