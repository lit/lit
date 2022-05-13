/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {Writable} from 'stream';
import {LitConsole} from '../lib/console.js';
import {ConsoleConstructorOptions} from 'console';

export class BufferedWritable extends Writable {
  buffer: Array<string> = [];

  constructor() {
    super({
      write: (chunk: unknown, encoding, callback) => {
        if (this.alsoLogToGlobalConsole) {
          console.log(chunk);
        }
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

  alsoLogToGlobalConsole = false;

  get text() {
    return this.buffer.join('');
  }
}

export class TestConsole extends LitConsole {
  readonly outputStream;
  readonly errorStream;
  constructor(opts: Partial<ConsoleConstructorOptions> = {}) {
    const outputStream = new BufferedWritable();
    const errorStream = new BufferedWritable();
    super({...opts, stdout: outputStream, stderr: errorStream});
    this.outputStream = outputStream;
    this.errorStream = errorStream;
  }

  set alsoLogToGlobalConsole(value: boolean) {
    this.outputStream.alsoLogToGlobalConsole = value;
    this.errorStream.alsoLogToGlobalConsole = value;
  }
  get alsoLogToGlobalConsole() {
    return this.outputStream.alsoLogToGlobalConsole;
  }
}
