/**
 * This is a server-old module that renders the HTML file shell.
 */

import {render} from '../lib/render-lit-html.js';
import {template, initialData} from './module.js';

export function renderAppWithInitialData() {
  return renderApp(initialData);
}

// This module runs in the app context with the client-side code, but is a
// server-only module. It doesn't use lit-html so that it can render the HTML
// shell in unbalanced fragments. By yielding the HTML pramable immediately
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
            import('/demo/app-client.js');
          });
        </script>
        <script type="module">
          import {hydrateShadowRoots} from './node_modules/template-shadowroot/template-shadowroot.js';
          hydrateShadowRoots(document.body);
        </script>
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
      </body>
    </html>`;
}
