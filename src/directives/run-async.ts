/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {directive, NodePart, Part} from '../lit-html.js';

interface AsyncRunState {
  key: unknown;
  promise: Promise<unknown>;
  abortController: AbortController;
  state: 'initial'|'pending'|'success'|'failure';
}

const runs = new WeakMap<Part, AsyncRunState>();

export type RunAsyncDirective<K> = (
    key: K,
    f: (key: K, options: {signal?: AbortSignal}) => Promise<unknown>,
    success: (result: any) => any,
    pending?: () => any,
    initial?: () => any,
    failure?: (e: Error) => any,
    ) => void;

/**
 * Runs an async function whenever the key changes, and calls one of several
 * lit-html template functions depending on the state of the async call:
 *
 *  - success() is called when the result of the function resolves.
 *  - pending() is called immediately
 *  - initial() is called if the function rejects with a InitialStateError,
 *    which lets the function indicate that it couldn't proceed with the
 *    provided key. This is usually the case when there isn't data to load.
 *  - failure() is called if the function rejects.
 */
export const runAsync = directive(
    <K>(
        key: K,
        f: (key: K, options: {signal?: AbortSignal}) => Promise<unknown>,
        success: (result: any) => any,
        pending?: () => any,
        initial?: () => any,
        failure?: (e: Error) => any,
        ) => (part: NodePart) => {
      const currentRunState = runs.get(part);

      // The first time we see a value we save and await the work function.
      if (currentRunState === undefined || currentRunState.key !== key) {
        // cancel a pending request
        if (currentRunState !== undefined &&
            currentRunState.state === 'pending') {
          currentRunState.abortController.abort();
        }
        const abortController = new AbortController();
        const promise = f(key, {signal: abortController.signal});
        // The state is immediately 'pending', since the function has been
        // executed, but if the function throws an InitialStateError to
        // indicate that it couldn't even start processing, then we will set
        // the state to 'initial'.
        const runState: AsyncRunState = {
          key,
          promise,
          state: 'pending',
          abortController,
        };
        runs.set(part, runState);

        Promise.resolve(promise).then(
            (value: unknown) => {
              runState.state = 'success';
              const currentRunState = runs.get(part);
              if (currentRunState !== runState) {
                return;
              }
              part.setValue(success(value));
              part.commit();
            },
            (error: Error) => {
              const currentRunState = runs.get(part);
              if (currentRunState !== runState) {
                return;
              }
              if (error instanceof InitialStateError &&
                  typeof initial === 'function') {
                runState!.state = 'initial';
                part.setValue(initial());
                part.commit();
              } else {
                runState!.state = 'failure';
                if (typeof failure === 'function') {
                  // render success callback
                  part.setValue(failure(error));
                  part.commit();
                }
              }
            });

        (async () => {
          await 0;
          const currentRunState = runs.get(part);
          if (currentRunState === runState &&
              currentRunState.state === 'pending') {
            part.startNode.parentNode!.dispatchEvent(new CustomEvent(
                'pending-state',
                {composed: true, bubbles: true, detail: {promise}}));
          }
        })();
      }

      // If the promise has not yet resolved, set/update the defaultContent
      if ((currentRunState === undefined ||
           currentRunState.state === 'pending') &&
          typeof pending === 'function') {
        part.setValue(pending());
      }
    });

export class InitialStateError extends Error {}
