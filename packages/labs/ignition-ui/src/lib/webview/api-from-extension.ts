/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import type {MessageFromWebviewToExtension} from '../protocol/extension-api-to-webview.js';
import {vscode} from './comlink-endpoint-to-vscode.js';
// @ts-expect-error Badly formatted package.json.
import * as vlq from 'vlq';

const {decode: vlqDecode} = vlq as unknown as VlqModule;

interface VlqModule {
  decode(string: string): number[];
  encode(value: number | number[]): string;
}

class ApiFromExtension {
  #sendMessage(message: MessageFromWebviewToExtension) {
    vscode.postMessage(message);
  }

  async focusSourceAtLocation(
    url: string,
    line: number,
    column: number
  ): Promise<void> {
    if (url.endsWith('.js')) {
      const mappedLocation = await applySourceMap(url, line, column);
      if (mappedLocation !== undefined) {
        url = mappedLocation.url;
        line = mappedLocation.line;
        column = mappedLocation.column;
      }
    }
    const filename = new URL(url).pathname.slice(1);
    this.#sendMessage({
      kind: 'focus-source-at-location',
      filename,
      line,
      column,
    });
  }

  setAutoChangeStoryUrl(autoChangeStoryUrl: boolean): void {
    this.#sendMessage({
      kind: 'set-auto-change-story-url',
      autoChangeStoryUrl,
    });
  }
}

export const apiFromExtension = new ApiFromExtension();

async function applySourceMap(
  url: string,
  fromLine: number,
  fromColumn: number
): Promise<undefined | {url: string; line: number; column: number}> {
  const sourceMap = await getSourceMap(url);
  if (sourceMap === undefined) {
    return;
  }
  const mappingLines = sourceMap.mappings.split(';');
  // Mappings might be from one file to multiple files, and between any file
  // formats, but for clarity the naming here will assume the source is a .ts
  // file and the target is a .js file.
  const currLocInTsFile = {url: '', line: 0, column: 0};
  let file = 0;
  for (let jsLine = 0; jsLine < mappingLines.length; jsLine++) {
    const lineSegmentsString = mappingLines[jsLine];
    if (lineSegmentsString === '') {
      continue; // empty line, no mappings
    }
    const vlqEncodedSegments = lineSegmentsString.split(',');
    let jsColumn = 0;
    for (const vlqEncodedSegment of vlqEncodedSegments) {
      const [jsColumnOffset, fileOffset, lineOffset, columnOffset] =
        vlqDecode(vlqEncodedSegment);
      jsColumn += jsColumnOffset;
      file += fileOffset ?? 0;
      currLocInTsFile.line += lineOffset ?? 0;
      currLocInTsFile.column += columnOffset ?? 0;
      if (jsLine >= fromLine && jsColumn >= fromColumn) {
        if (sourceMap.sources[file] == null) {
          return undefined;
        }
        currLocInTsFile.url = new URL(sourceMap.sources[file], url).href;
        return currLocInTsFile;
      }
    }
  }
  return undefined;
}

interface SourceMap {
  file: string;
  mappings: string;
  names: string[];
  sourceRoot: string;
  sources: string;
  version: string;
}

// When we add HMR, we'll need to clear this cache on each HMR.
const sourceMapCache = new Map<string, Promise<SourceMap | undefined>>();
async function getSourceMap(url: string): Promise<SourceMap | undefined> {
  if (!sourceMapCache.has(url)) {
    sourceMapCache.set(url, loadSourceMap(url));
  }
  return sourceMapCache.get(url);
}

async function loadSourceMap(url: string): Promise<SourceMap | undefined> {
  const headers = await fetch(url);
  const jsFileContents = await headers.text();
  // Inline source maps.
  const b64EncodedSourceMapString = jsFileContents.match(
    /\/\/# sourceMappingURL=data:application\/json;base64,(.+)/
  )?.[1];
  if (b64EncodedSourceMapString) {
    return JSON.parse(atob(b64EncodedSourceMapString));
  }
  // Source map as URL.
  const sourceMapUrl = jsFileContents.match(/\/\/# sourceMappingURL=(.+)/)?.[1];
  if (sourceMapUrl) {
    const sourceMapHeaders = await fetch(new URL(sourceMapUrl, url));
    return sourceMapHeaders.json();
  }
  return;
}
