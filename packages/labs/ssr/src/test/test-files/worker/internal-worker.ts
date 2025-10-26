import {isMainThread, parentPort, workerData} from 'node:worker_threads';

import {render} from '../../../lib/render.js';
import {templateWithTextExpression} from '../render-test-module.js';

import '../../../lib/install-global-dom-shim.js';

if (!isMainThread && parentPort) {
  const data = workerData as {value: string};

  const template = templateWithTextExpression(data.value);
  for await (const chunk of render(template)) {
    parentPort.postMessage(chunk);
  }
  parentPort.postMessage(null);
}
