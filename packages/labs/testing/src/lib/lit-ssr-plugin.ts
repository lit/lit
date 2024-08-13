/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {Worker} from 'worker_threads';
import * as pathlib from 'path';
import {pathToFileURL} from 'node:url';
import {litSsrPluginCommand} from './constants.js';

import type {TemplateResult} from 'lit';
import type {TestRunnerPlugin} from '@web/test-runner';

export interface LitSsrPluginOptions {
  /**
   * This script will be imported before the modules inside the worker
   * that renders the template on server-side.
   * This allows registering hooks for Node.js (e.g. to allow importing .ts
   * files directly) or general setup.
   */
  initScript?: string;
}

export interface Payload {
  template: TemplateResult;
  modules: string[];
}

export function litSsrPlugin({
  initScript,
}: LitSsrPluginOptions = {}): TestRunnerPlugin<Payload> {
  return {
    name: 'lit-ssr-plugin',
    async executeCommand({command, payload}) {
      if (command !== litSsrPluginCommand) {
        return undefined;
      }

      if (!payload) {
        throw new Error(`Missing payload for ${litSsrPluginCommand} command`);
      }

      const {template, modules} = payload;
      const resolvedModules = modules.map(
        (module) => pathToFileURL(pathlib.join(process.cwd(), module)).href
      );
      const resolvedInitScript = initScript
        ? pathToFileURL(pathlib.join(process.cwd(), initScript)).href
        : undefined;

      let resolve: (value: string) => void;
      let reject: (reason: unknown) => void;
      const promise = new Promise<string>((res, rej) => {
        resolve = res;
        reject = rej;
      });

      const worker = new Worker(new URL('./worker.js', import.meta.url), {
        workerData: {
          template,
          modules: resolvedModules,
          initScript: resolvedInitScript,
        },
      });

      worker.on('error', (err) => {
        reject(err);
      });

      worker.on('message', (message) => {
        resolve(message);
      });

      return promise;
    },
  };
}
