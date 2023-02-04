/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * This is a server-only module that renders the HTML file shell.
 */

import {render} from '../../lib/render-lit-html.js';
import {template, initialData} from './module.js';

export function renderAppWithInitialData() {
  return renderApp(initialData);
}

// This module runs in the app context with the client-side code, but is a
// server-only module. It doesn't use lit-html so that it can render the HTML
// shell in unbalanced fragments. By yielding the HTML preamble immediately
// with no lit-html template preparation or rendering needed, we minimize TTFB,
// And can get the browser to start prefetch as soon as possible.
export function* renderApp(data: typeof initialData) {
  yield `
    <!doctype html>
    <html>
      <head>
        <!-- This little script loads the client script on a button click. This
             lets us see that only the HTML loads for first render -->
        <script type="module">
          const button = document.querySelector('button');
          button.addEventListener('click', () => {
            import('/demo/vm-modules/app-client.js');
          });
        </script>
        <script src="./node_modules/@webcomponents/template-shadowroot/template-shadowroot.min.js"></script>
        `;
  yield `
      </head>
      <body>
        <button>Hydrate</button>
        <div>`;

  // Call the SSR render() function to render a client/server shared template.
  yield* render(template(data));

  yield `
        </div>
        <script>TemplateShadowRoot.hydrateShadowRoots(document.body);</script>
      </body>
</html>`;
}
