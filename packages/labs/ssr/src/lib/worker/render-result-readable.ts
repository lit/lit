import {PassThrough} from 'node:stream';
import type {WorkerRenderResult} from './render.js';

export class RenderResultReadable extends PassThrough {
  private _queue: Array<string | null> = [];
  private _waiting = false;

  constructor(result: WorkerRenderResult) {
    super();
    this.on('drain', () => {
      this._waiting = false;
      this._processQueue();
    });
    result.addEventListener('data', (event) => {
      this._queue.push(event.detail);
      this._processQueue();
    });
    result.addEventListener('end', () => {
      this._queue.push(null);
      this._processQueue();
    });
    result.addEventListener('error', (event) => {
      this.destroy(event.detail);
    });
  }

  private _processQueue() {
    if (this._waiting) {
      return;
    }
    while (this._queue.length > 0) {
      const chunk = this._queue.shift();
      if (chunk === null) {
        this.end();
        return;
      } else if (this.write(chunk) === false) {
        this._waiting = true;
        return;
      }
    }
  }
}
