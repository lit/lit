/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {parentPort, workerData} from 'worker_threads';
import {render} from '@lit-labs/ssr/lib/render-with-global-dom-shim.js';

import type {Payload} from './litSsrPlugin.js';

if (parentPort === null) {
  throw new Error('worker.js must only be run in a worker thread');
}

const {template, modules} = workerData as Payload;

await Promise.all(modules.map((module) => import(module)));

// Dangerously spoof TemplateStringsArray
const strings = template.strings;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(strings as any).raw = strings;

let rendered = '';
for (const str of render({...template, strings}, {deferHydration: true})) {
  rendered += str;
}

parentPort.postMessage(rendered);
