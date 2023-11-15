/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {parentPort} from 'worker_threads';
import {render} from '@lit-labs/ssr';
import {unsafeHTML} from 'lit/directives/unsafe-html.js';
import {DeclarativeStyleDedupeUtility} from '@lit-labs/ssr/lib/declarative-style-dedupe.js';

import type {Message} from './types.js';

if (parentPort === null) {
  throw new Error('worker.js must only be run in a worker thread');
}

let initialized = false;
let shouldDedupeStyles = false;

parentPort.on('message', async (message: Message) => {
  switch (message.type) {
    case 'initialize-request': {
      if (!initialized) {
        const {imports, dedupeStyles} = message;
        shouldDedupeStyles = dedupeStyles;
        await Promise.all(imports.map((module) => import(module)));
        const response: Message = {type: 'initialize-response'};
        parentPort!.postMessage(response);
      }
      initialized = true;
      break;
    }

    case 'render-request': {
      const {id, content} = message;
      let rendered = '';
      const renderOpts = {
        dedupeStyles: shouldDedupeStyles
          ? new DeclarativeStyleDedupeUtility()
          : undefined,
      };
      for (const str of render(unsafeHTML(content), renderOpts)) {
        rendered += str;
      }
      const response: Message = {
        type: 'render-response',
        id,
        rendered,
      };
      parentPort!.postMessage(response);
      break;
    }
  }
});
