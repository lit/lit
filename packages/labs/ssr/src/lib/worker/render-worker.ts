import {isMainThread, workerData} from 'node:worker_threads';

import type {RenderWorkerData} from '../render-worker.js';

import '../install-global-dom-shim.js';

if (!isMainThread) {
  const {workerModule, timeout} = workerData as RenderWorkerData<unknown>;
  await import(workerModule);
  // A Node.js worker exits when there are no more tasks in the event loop.
  // However, we return a ReadableStream to the main thread, which may be
  // still being read from. To prevent the worker from exiting too early, we
  // add a long-lived timer. This will be cleaned up when the worker exits.
  setTimeout(() => {
    throw new Error(`Render worker timed out after ${timeout} seconds.`);
  }, timeout * 1000);
}
