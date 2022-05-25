/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {parentPort} from 'worker_threads';
import {render} from '@lit-labs/ssr/lib/render-with-global-dom-shim.js';

import type {
  InitializeResponse,
  RenderResponse,
  RequestMessage,
} from './types.js';

if (parentPort === null) {
  throw new Error('worker.js must only be run in a worker thread');
}

let initialized = false;

parentPort.on('message', async (message: RequestMessage) => {
  switch (message.type) {
    case 'initialize-request': {
      if (!initialized) {
        const {imports} = message;
        await Promise.all(imports.map((module) => import(module)));
        const response: InitializeResponse = {type: 'initialize-response'};
        parentPort!.postMessage(response);
      }
      initialized = true;
      break;
    }

    case 'render-request': {
      const {template} = message;

      // Dangerously spoof TemplateStringsArray
      const strings = template.strings;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (strings as any).raw = strings;

      let rendered = '';
      for (const str of render(
        {...template, strings},
        {deferHydration: true}
      )) {
        rendered += str;
      }
      const response: RenderResponse = {
        type: 'render-response',
        rendered,
      };
      parentPort!.postMessage(response);
      break;
    }

    default: {
      const unreachable: never = message;
      throw new Error(`Unexpected request: ${JSON.stringify(unreachable)}`);
    }
  }
});
