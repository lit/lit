import {Worker} from 'node:worker_threads';

import type {RenderInfo} from '../render-value.js';
import {isTemplateStringsArray} from './is-template-strings-array.js';

export interface WorkerRenderInfo {
  worker: Worker;
}

export interface WorkerStreamChunk {
  type: 'renderChunk' | 'customElementRendered';
  data: string;
}

export interface WorkerPayload<T = unknown> {
  value: T;
  renderInfo: Partial<Omit<RenderInfo, 'customElementRendered'>>;
  hasCustomElementRendered: boolean;
  templateStringsMap: Map<TemplateStringsArray, readonly string[]>;
  stream: WritableStream<WorkerStreamChunk>;
}

export interface WorkerRenderResult extends EventTarget {
  addEventListener(
    type: 'data',
    listener: (event: CustomEvent<string>) => void
  ): void;
  addEventListener(type: 'end', listener: (event: Event) => void): void;
  addEventListener(
    type: 'error',
    listener: (event: CustomEvent<Error>) => void
  ): void;
}

export function render(
  value: unknown,
  renderInfo: WorkerRenderInfo & Partial<RenderInfo>
): WorkerRenderResult {
  const {worker, customElementRendered, ...rest} = renderInfo;

  const result = new EventTarget() as WorkerRenderResult;
  const stream = new WritableStream<WorkerStreamChunk>({
    write(chunk) {
      if (chunk.type === 'renderChunk') {
        result.dispatchEvent(new CustomEvent('data', {detail: chunk.data}));
      } else if (chunk.type === 'customElementRendered') {
        customElementRendered?.(chunk.data);
      }
    },
    close() {
      result.dispatchEvent(new Event('end'));
    },
    abort(reason) {
      result.dispatchEvent(
        new CustomEvent('error', {
          detail: reason instanceof Error ? reason : new Error(String(reason)),
        })
      );
    },
  });
  const templateStringsMap = findTemplateStringsArray(value);
  const payload: WorkerPayload = {
    value,
    renderInfo: rest,
    hasCustomElementRendered: !!customElementRendered,
    templateStringsMap,
    stream,
  };
  worker.postMessage(payload, [stream]);

  return result;
}

function findTemplateStringsArray(
  value: unknown,
  map = new Map<TemplateStringsArray, readonly string[]>()
): Map<TemplateStringsArray, readonly string[]> {
  if (!value || (!Array.isArray(value) && typeof value !== 'object')) {
    return map;
  }

  for (const part of Object.values(value)) {
    if (isTemplateStringsArray(part)) {
      map.set(part, part.raw);
    } else {
      findTemplateStringsArray(part, map);
    }
  }

  return map;
}
