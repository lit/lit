import {isMainThread, parentPort, workerData} from 'node:worker_threads';

import type {RenderWorkerOptions} from './create-render-worker.js';
import {registerRenderRequestHandler} from './render-request-handler.js';
import {render} from '../render.js';

import '../install-global-dom-shim.js';

if (isMainThread || !parentPort) {
  throw new Error('Render worker is not running in a worker thread');
}

const initialData = workerData as RenderWorkerOptions;
if (initialData.modules) {
  for (const module of initialData.modules) {
    await import(module);
  }
}

registerRenderRequestHandler(async (value, renderInfo, context) => {
  for await (const chunk of render(value, renderInfo)) {
    context.write(chunk as string);
  }
});
