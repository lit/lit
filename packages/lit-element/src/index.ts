/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

export * from '@lit/reactive-element';
export * from 'lit-html';
export * from './lit-element.js';
export * from './decorators.js';

console.warn(
  "The main 'lit-element' module entrypoint is deprecated. Please update " +
    "your imports to use the 'lit' package: 'lit' and 'lit/decorators.ts' " +
    "or import from 'lit-element/lit-element.ts'. See https://lit.dev/docs/releases/upgrade/#update-packages-and-import-paths for more information."
);
