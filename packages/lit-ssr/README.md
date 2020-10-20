# lit-ssr

lit-html & LitElement SSR server

## Setup

This repo requires Node 14+ because of it's use of experimental VM modules for
creating VM sandbox for executing the client-side code in. It also requires
templates/elements be authored using pre-release versions of lit-html@2 and
lit-element@3.

## Usage

### High-level API: render HTML pages

The easiest way to get started using lit-ssr is to add the `renderHTMLFile`
middleware from the `koa-render-html-file` module to your server. This
middleware will server-side render any `Lit` custom elements included in html
files served in your application. It handles URLs to files with `.html` or bare
paths with `accept: text/html` or `accept: *`. If a static file does not exist
at the specified URL path, the `fallback` file will be rendered/served.

Below is an example usage of the lit-ssr `renderHTMLFile` middleware:

```js
// Example server.js

import * as path from 'path';
import Koa from 'koa';
import staticFiles from 'koa-static';
import koaNodeResolve from 'koa-node-resolve';
import {renderHTMLFile} from 'lit-ssr/lib/koa-render-html-file.js';

const {nodeResolve} = koaNodeResolve;

const root = /* Root of your webapp */;

(async() => {

  const port = 8080;
  const app = new Koa();
  app.use(nodeResolve({root}));
  app.use(renderHTMLFile({root, fallback: 'index.html'})); // Use `renderHTMLFile` plugin
  app.use(staticFiles(root));
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });

})();
```

When using this middleware, there are a few steps you should do to prepare you
HTML files for proper server rendering:

- Add the `template-shadowroot` polyfill to hydrate server-rendered `<template shadowroot>` elements. For example:
  ```html
  <script type="module">
    import {hydrateShadowRoots} from './node_modules/template-shadowroot/template-shadowroot.js';
    hydrateShadowRoots(document.body);
  </script>
  ```
- Add `ssr` attribute to scripts that _should_ be executed on the server, for
  example, scripts that include custom element definitions. For example:
  ```html
  <script type="module" src="my-app-components.js" ssr></script>
  ```
- (Optional): Add `type="ssr-only"` attribute to scripts that should _only_ be
  executed on the server. This is useful for fetching/initializing application
  data on the server. Note that if a `ssr` module script exports an async
  function named `initializeSSR`, it will be invoked, and its return value can
  be rendered into the html page (see below). For example:

  ```html
  <script type="ssr-only" src="initialize-server-data.js" ssr></script>
  ```

  ```js
  // Example: initialize-server-data.js

  export const initializeSSR = async () => {
    // Fetch some initial data and put it on (server-side) window, for use by
    // server-rendered components
    const state = await (await fetch('some-data.json')).toJSON();
    window.__PRELOADED_STATE__ = state;
    // Serialize state (escaping HTML brackets for safety) and return as a Lit
    // value to interpolate into the client-side HTML page
    const stateString = JSON.stringify(state).replace(/</g, '\\u003c');
    return [
      unsafeHTML(`<script>window.__PRELOADED_STATE__=${stateString}</script>`),
    ];
  };
  ```

- Add `<!--lit-ssr-value-->` comments to HTML to interpolate any values returned
  from `initializeSSR` exports discovered in scripts into the serialized HTML
  page.

Full example HTML file:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>My App</title>
    <script type="module">
      import {hydrateShadowRoots} from './node_modules/template-shadowroot/template-shadowroot.js';
      hydrateShadowRoots(document.body);
    </script>
    <script type="ssr-only" src="initialize-server-data.js"></script>
    <!--lit-ssr-value-->
    <script type="module" src="my-app.js" ssr></script>
  </head>
  <body>
    <my-app></my-app>
  </body>
</html>
```

### Low-level API: render `lit-html` templates

As a lower-level means of rendering `lit-html` templates (optionally containing
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
import {myTemplate} from 'my-template.js';
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

for await (let text of ssrResult) {
  console.log(text);
}
```
