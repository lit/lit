/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {Worker} from 'worker_threads';
import * as pathlib from 'path';
import {litSsrPluginCommand} from './constants.js';

import type {TemplateResult} from 'lit';

export interface Payload {
  template: TemplateResult;
  modules: string[];
}

interface CommandParam {
  command: typeof litSsrPluginCommand;
  payload: Payload;
}

export function litSsrPlugin() {
  return {
    name: 'lit-ssr-plugin',
    async executeCommand({
      command,
      payload: {template, modules},
    }: CommandParam): Promise<string | undefined> {
      if (command === litSsrPluginCommand) {
        const resolvedModules = modules.map((module) =>
          pathlib.join(process.cwd(), module)
        );

        let resolve: (value: string) => void;
        let reject: (reason: unknown) => void;
        const promise = new Promise<string>((res, rej) => {
          resolve = res;
          reject = rej;
        });

        const worker = new Worker(new URL('./worker.js', import.meta.url), {
          workerData: {template, modules: resolvedModules},
        });

        worker.on('error', (err) => {
          reject(err);
        });

        worker.on('message', (message) => {
          resolve(message);
        });

        return promise;
      }
      return undefined;
    },
  };
}
