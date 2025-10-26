import {PassThrough} from 'node:stream';
import {WritableStream} from 'node:stream/web';
import {Worker} from 'node:worker_threads';

export class RenderResultReadable extends PassThrough {
  private _queue: Array<string | null> = [];
  private _waiting = false;

  constructor(options: {data?: unknown; worker: Worker});
  constructor(options: {data?: unknown; workerUrl: URL});
  constructor({
    data,
    worker,
    workerUrl,
  }: {
    data?: unknown;
    worker?: Worker;
    workerUrl?: URL;
  }) {
    super();
    this.on('drain', () => {
      this._waiting = false;
      this._processQueue();
    });

    if (worker) {
      const stream = new WritableStream<string>({
        write: (chunk) => {
          this._queue.push(chunk);
          this._processQueue();
        },
        close: () => {
          this._queue.push(null);
          this._processQueue();
        },
        abort: (err) => {
          this.destroy(err);
        },
      });
      worker.postMessage({data, stream}, [stream]);
    } else if (workerUrl) {
      const worker = new Worker(workerUrl, {workerData: data})
        .on('message', (chunk) => {
          this._queue.push(chunk);
          this._processQueue();
          if (chunk === null) {
            worker.terminate();
          }
        })
        .on('error', (err) => {
          this.destroy(err);
        })
        .on('exit', (code) => {
          if (code !== 0) {
            this.destroy(new Error(`Worker stopped with exit code ${code}`));
          }
        });
    } else {
      throw new Error('Either worker or workerUrl must be provided');
    }
  }

  private _processQueue() {
    if (this._waiting) {
      return;
    }
    while (this._queue.length > 0) {
      const chunk = this._queue.shift();
      if (chunk === null) {
        this.end();
      } else if (this.write(chunk) === false) {
        this._waiting = true;
        return;
      }
    }
  }
}
