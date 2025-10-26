import {isMainThread, parentPort} from 'node:worker_threads';

import type {WorkerPayload} from './render.js';
import type {RenderInfo} from '../render-value.js';

export interface RenderRequestContext
  extends Pick<
    WritableStreamDefaultWriter<string>,
    'write' | 'abort' | 'close'
  > {}

export function parseRenderRequestData<T = unknown>(
  payload: WorkerPayload<T>
): {value: T; renderInfo: Partial<RenderInfo>; context: RenderRequestContext} {
  const {
    value,
    renderInfo,
    hasCustomElementRendered,
    templateStringsMap,
    stream,
  } = payload;
  if (templateStringsMap.size > 0) {
    // We cannot directly mutate the map entries, as the transfer
    // partially loses identity of the arrays, but comparing
    // the values against the map entries still works.
    patchTemplateStringsArray(value, templateStringsMap);
  }

  const writer = stream.getWriter();
  const context: RenderRequestContext = {
    write: (chunk: string) => writer.write({type: 'renderChunk', data: chunk}),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    abort: (reason?: any) => writer.abort(reason),
    close: () => writer.close(),
  };
  const internalRenderInfo: Partial<RenderInfo> = renderInfo;
  if (hasCustomElementRendered) {
    internalRenderInfo.customElementRendered = (tagName: string) => {
      writer.write({type: 'customElementRendered', data: tagName});
    };
  }

  return {value, renderInfo: internalRenderInfo, context};
}

let alreadyRegistered = false;
export function registerRenderRequestHandler<T = unknown>(
  handler: (
    value: T,
    renderInfo: Partial<RenderInfo>,
    context: RenderRequestContext
  ) => Promise<void> | void
) {
  if (isMainThread || !parentPort) {
    throw new Error(
      'handleRenderRequest should be called from within a worker thread'
    );
  }
  if (alreadyRegistered) {
    throw new Error('A render request handler has already been registered');
  }
  alreadyRegistered = true;

  parentPort.on('message', async (payload: WorkerPayload<T>) => {
    const {value, renderInfo, context} = parseRenderRequestData<T>(payload);
    try {
      await handler(value as T, renderInfo, context);
      await context.close();
    } catch (err) {
      context.abort(err);
    }
  });
}

function patchTemplateStringsArray(
  value: unknown,
  templateStringsMap: Map<TemplateStringsArray, readonly string[]>
) {
  if (!value || (!Array.isArray(value) && typeof value !== 'object')) {
    return;
  }

  for (const part of Object.values(value)) {
    if (templateStringsMap.has(part)) {
      Object.defineProperty(part, 'raw', {value: templateStringsMap.get(part)});
    } else {
      patchTemplateStringsArray(part, templateStringsMap);
    }
  }
}
