# @lit-labs/workers

This package will allow Lit templates and components to be run inside a worker and render to the main document. It is highly experimental.

## Example

```ts
import {createWorkerElement} from '../lib/worker-element.js';

const localElementClass = createWorkerElement({
  tagName: 'test-element',
  url: new URL('./test-element.js', import.meta.url).href,
  attributes: ['name'],
});
customElements.define('local-test-element', localElementClass);
```

Then every instance of `<local-test-element>` will get and run in its own worker.
