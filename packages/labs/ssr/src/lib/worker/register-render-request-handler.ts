import {isMainThread, parentPort} from 'node:worker_threads';

export interface RenderRequestContext {
  write(chunk: string): Promise<void>;
}

export function registerRenderRequestHandler<T = unknown>(
  handler: (data: T, context: RenderRequestContext) => Promise<void> | void
) {
  if (isMainThread || !parentPort) {
    throw new Error(
      'handleRenderRequest should be called from within a worker thread'
    );
  }

  parentPort.on('message', async (message) => {
    const {data, stream} = message as {data: T; stream: WritableStream<string>};
    const writer = stream.getWriter();
    try {
      await handler(data, writer);
      await writer.close();
    } catch (err) {
      writer.abort(err);
    }
  });
}
