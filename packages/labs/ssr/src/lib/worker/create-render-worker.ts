import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {Worker} from 'node:worker_threads';

export interface RenderWorkerOptions {
  modules?: string[];
}

export function createRenderWorker(options: RenderWorkerOptions = {}) {
  const resolveModule = (module: string): string =>
    pathToFileURL(join(process.cwd(), module)).href;
  // We want to support both relative/absolute paths and external packages.
  const modules =
    options.modules?.map((m) => (m.startsWith('.') ? resolveModule(m) : m)) ??
    [];

  return new Worker(new URL('./render-worker.js', import.meta.url), {
    workerData: {modules},
  });
}
