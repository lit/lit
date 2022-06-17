/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {Writable} from 'stream';
import {LitConsole} from '../lib/console.js';
import {ConsoleConstructorOptions} from 'console';
import * as pathlib from 'path';
import * as url from 'url';
import {FilesystemTestRig} from '@lit-internal/tests/utils/filesystem-test-rig.js';

export class BufferedWritable extends Writable {
  buffer: Array<string> = [];

  constructor() {
    super({
      write: (chunk: unknown, encoding, callback) => {
        const decodeResult = this.decodeChunk(chunk, encoding);
        if (!decodeResult.ok) {
          callback(decodeResult.error);
          return;
        }
        const decoded = decodeResult.string;
        if (this.alsoLogToGlobalConsole) {
          console.log(decoded);
        }
        this.buffer.push(decoded);
        callback();
      },
      writev: (_chunks, callback) => {
        callback(new Error('Not implemented'));
      },
    });
  }

  private decodeChunk(
    chunk: unknown,
    encoding: BufferEncoding
  ): {ok: true; string: string} | {ok: false; error: Error} {
    if (encoding === 'utf-8') {
      return {ok: true, string: chunk as string};
    } else if ((encoding as 'buffer') === 'buffer') {
      return {ok: true, string: (chunk as Buffer).toString()};
    } else {
      return {ok: false, error: new Error(`Unsupported encoding ${encoding}`)};
    }
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

/**
 * We lazily install commands, but most tests just want to use the latest
 * versions of the commands in the monorepo.
 */
export const symlinkAllCommands = async (rig: FilesystemTestRig) => {
  const symLinks: Array<{packageName: string[]; relPath: string[]}> = [
    {
      relPath: ['..', '..', '..', 'gen-wrapper-react'],
      packageName: ['@lit-labs', 'gen-wrapper-react'],
    },
    {
      relPath: ['..', '..', '..', 'gen-wrapper-vue'],
      packageName: ['@lit-labs', 'gen-wrapper-vue'],
    },
    {
      relPath: ['..', '..', '..', 'cli-localize'],
      packageName: ['@lit-labs', 'cli-localize'],
    },
  ];
  await Promise.all(
    symLinks.map(async ({packageName, relPath}) => {
      await rig.symlink(
        pathlib.resolve(
          pathlib.join(url.fileURLToPath(import.meta.url), ...relPath)
        ),
        pathlib.join('node_modules', ...packageName),
        'dir'
      );
    })
  );
};
