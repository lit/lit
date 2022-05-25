/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {Worker} from 'worker_threads';
import * as pathlib from 'path';

import type {TemplateResult} from 'lit';
import type {
  InitializeRequest,
  RenderRequest,
  ResponseMessage,
} from './worker/types.js';

export type Command = 'lit-ssr-render';

export interface Payload {
  template: TemplateResult;
  modules: string[];
}

interface CommandParam {
  command: Command;
  payload: Payload;
}

export function litSsrPlugin() {
  return {
    name: 'lit-ssr-plugin',
    async executeCommand({
      command,
      payload: {template, modules},
    }: CommandParam): Promise<string> {
      switch (command) {
        case 'lit-ssr-render': {
          const resolvedComponentModules = modules.map((module) =>
            pathlib.resolve(process.cwd(), module)
          );

          const worker = new Worker(
            new URL('./worker/worker.js', import.meta.url)
          );

          worker.on('error', (err) => {
            console.log(
              'Unexpected error while rendering lit component in worker thread',
              err
            );
            throw err;
          });

          let requestResolve: () => void;
          const requestPromise = new Promise<void>((resolve) => {
            requestResolve = resolve;
          });

          let responseResolve: (value: string) => void;
          const responsePromise = new Promise<string>((resolve) => {
            responseResolve = resolve;
          });

          worker.on('message', (message: ResponseMessage) => {
            switch (message.type) {
              case 'initialize-response': {
                requestResolve();
                break;
              }

              case 'render-response': {
                const {rendered} = message;
                responseResolve(rendered);
                break;
              }

              default: {
                const unreachable: never = message;
                throw new Error(
                  `Unexpected response: ${JSON.stringify(unreachable)}`
                );
              }
            }
          });

          const initializeRequestMessage: InitializeRequest = {
            type: 'initialize-request',
            imports: resolvedComponentModules,
          };

          worker.postMessage(initializeRequestMessage);
          await requestPromise;

          const renderRequestMessage: RenderRequest = {
            type: 'render-request',
            template,
          };
          worker.postMessage(renderRequestMessage);

          return responsePromise;
        }

        default: {
          const unreachable: never = command;
          throw new Error(`Unknown command: ${unreachable}`);
        }
      }
    },
  };
}
