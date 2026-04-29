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
   * These modules will be imported from each newly created worker.
   * (A worker is created for each call to render a template via SSR).
   * This allows registering hooks for Node.js or general setup.
   */
  workerInitModules?: string[];
}

export interface Payload {
  template: TemplateResult;
  modules: string[];
}

export interface PayloadWithWorkerInitModules
  extends Payload,
    Required<LitSsrPluginOptions> {}

export function litSsrPlugin(
  options: LitSsrPluginOptions = {}
): TestRunnerPlugin<Payload> {
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
      const resolveModule = (module: string): string =>
        pathToFileURL(pathlib.join(process.cwd(), module)).href;
      const resolvedModules = modules.map(resolveModule);
      // We want to support both relative/absolute paths and external packages
      // to allow using other hook implementations.
      const resolvedWorkerInitModules =
        options.workerInitModules?.map((m) =>
          m.startsWith('.') ? resolveModule(m) : m
        ) ?? [];

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
          workerInitModules: resolvedWorkerInitModules,
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
