/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {parentPort, workerData} from 'worker_threads';
import {render} from '@lit-labs/ssr';

import type {PayloadWithWorkerInitModules} from './lit-ssr-plugin.js';

if (parentPort === null) {
  throw new Error('worker.js must only be run in a worker thread');
}

const {template, modules, workerInitModules} =
  workerData as PayloadWithWorkerInitModules;

// Import worker modules sequentially, as these can have side effects.
// (e.g. registering Node.js hooks: https://nodejs.org/api/module.html#customization-hooks)
for (const workerModule of workerInitModules) {
  await import(workerModule);
}

await Promise.all(modules.map((module) => import(module)));

// Dangerously spoof TemplateStringsArray by adding back the `raw` property
// property which gets stripped during serialization of the TemplateResult.
// This is needed to get through the check here
// https://github.com/lit/lit/blob/1fbd2b7a1e6da09912f5c681d2b6eaf1c4920bb4/packages/lit-html/src/lit-html.ts#L867
const strings = template.strings;
(strings as {raw: TemplateStringsArray['raw']}).raw = strings;

let rendered = '';
for (const str of render({...template, strings}, {deferHydration: true})) {
  rendered += str;
}

parentPort.postMessage(rendered);
