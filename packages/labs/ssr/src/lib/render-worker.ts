import {join} from 'node:path';
import {Readable} from 'node:stream';
import {ReadableStream} from 'node:stream/web';
import {pathToFileURL} from 'node:url';
import {
  isMainThread,
  parentPort,
  Worker,
  workerData,
} from 'node:worker_threads';

import type {RenderResult, ThunkedRenderResult} from './render-result.js';
import {RenderResultReadable} from './render-result-readable.js';

export interface RenderInWorkerOptions {
  value: unknown;
  workerModule: string;
  timeout?: number;
}

export interface RenderWorkerData<T> {
  value: T;
  workerModule: string;
  timeout: number;
}

export function renderInWorker(options: RenderInWorkerOptions) {
  if (!isMainThread) {
    throw new Error(
      'renderInWorker() should only be called from the main thread.'
    );
  }

  const workerModule = options.workerModule.startsWith('.')
    ? pathToFileURL(join(process.cwd(), options.workerModule)).href
    : options.workerModule;
  const workerData: RenderWorkerData<unknown> = {
    timeout: options.timeout ?? 30,
    value: options.value,
    workerModule,
  };
  console.time('create Worker');
  const worker = new Worker(
    new URL('./worker/render-worker.js', import.meta.url),
    {workerData}
  );
  console.timeEnd('create Worker');
  return new Promise<Readable>((resolve, reject) => {
    worker.once('message', (message) => {
      if (message instanceof ReadableStream) {
        const readable = Readable.fromWeb(message);
        readable.once('close', () => {
          worker.terminate();
        });
        resolve(readable);
      } else {
        worker.terminate();
        reject(
          new Error(
            `Unexpected message from worker! Expected ReadableStream but received ${message}.`
          )
        );
      }
    });
    worker.once('error', (error) => {
      worker.terminate();
      reject(error);
    });
    worker.once('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  });
}

export async function renderFromWorker<T>(
  handler: (
    value: T
  ) =>
    | RenderResult
    | ThunkedRenderResult
    | Promise<RenderResult | ThunkedRenderResult>
): Promise<void> {
  if (isMainThread) {
    throw new Error(
      'renderFromWorker() should only be called from a worker thread.'
    );
  } else if (!parentPort) {
    throw new Error('Worker does not have a parent port.');
  }

  const result = await handler(workerData.value);
  const readable = new RenderResultReadable(result);
  const stream = Readable.toWeb(readable);
  parentPort.postMessage(stream, [stream]);
}
