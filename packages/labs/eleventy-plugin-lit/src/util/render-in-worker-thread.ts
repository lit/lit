import {parentPort, workerData} from 'worker_threads';
import {render} from '@lit-labs/ssr/lib/render-with-global-dom-shim.js';
import {unsafeHTML} from 'lit/directives/unsafe-html.js';

if (parentPort === null) {
  throw new Error(
    'render-in-worker-thread.js must only be run in a worker thread'
  );
}

(async function () {
  for (const module of workerData as string[]) {
    await import(module);
  }

  parentPort.on('message', (content: string) => {
    let renderedContent = '';
    for (const str of render(unsafeHTML(content))) {
      renderedContent += str;
    }
    parentPort!.postMessage(renderedContent);
  });
})();
