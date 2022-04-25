/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {Writable} from 'stream';

export class BufferedWritable extends Writable {
  buffer: Array<string> = [];

  constructor() {
    super({
      write: (chunk, encoding, callback) => {
        if (encoding === 'utf-8') {
          this.buffer.push(chunk as string);
        } else if ((encoding as 'buffer') === 'buffer') {
          this.buffer.push((chunk as Buffer).toString());
        } else {
          callback(new Error(`Unsupported encoding ${encoding}`));
        }
        callback();
      },
      writev: (_chunks, callback) => {
        callback(new Error('Not implemented'));
      },
    });
  }

  get text() {
    return this.buffer.join('');
  }
}
