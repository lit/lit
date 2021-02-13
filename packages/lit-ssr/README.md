# @lit-labs/ssr

Lit SSR server

## Status

`@lit-labs/ssr` is pre-release software, not quite ready for public consumption. As we develop it we are using it as a test bed to ensure that the next versions of `lit-html` and `lit-element` are SSR-ready.

## Developing

### Setup

This package requires Node 14+ because of its use of experimental VM modules for creating VM sandbox for executing the client-side code in. It also requires
templates and elements be authored using pre-release versions of `lit-html@2.0` and `lit-element@3.0`.

### Usage

#### Low-level API: render `lit-html` templates

As a low-level means of rendering `lit-html` templates (optionally containing
`LitElement` components), the `renderModule` function from the
`render-module` module will import a given module into a server-side VM
sandbox shimmed with the minimal DOM shim required for Lit server rendering,
execute a given function exported from that module, and return its value.

Within that module, you an call the `render` method from the
`render-lit-html` module to render `lit-html` templates and return an async
iterable that emits the serialized strings of the given template.

Example:

```js
// Example: render-template.js

import {render} from 'lit-ssr/lib/render-lit-html.js';
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

for (let text of ssrResult) {
  console.log(text);
}
```
