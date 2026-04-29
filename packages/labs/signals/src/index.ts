/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {Signal} from 'signal-polyfill';

export * from 'signal-polyfill';
export * from './lib/signal-watcher.js';
export * from './lib/watch.js';
export * from './lib/html-tag.js';

export const State = Signal.State;
export const Computed = Signal.Computed;

export const signal = <T>(value: T, options?: Signal.Options<T>) =>
  new Signal.State(value, options);
export const computed = <T>(callback: () => T, options?: Signal.Options<T>) =>
  new Signal.Computed<T>(callback, options);
