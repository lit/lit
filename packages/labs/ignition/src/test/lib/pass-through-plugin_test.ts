/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import ts from 'typescript';
import {PassThroughPlugin} from '../../lib/pass-through-plugin.js';
import {test, describe as suite} from 'node:test';
import * as assert from 'node:assert';
import {readFile} from 'fs/promises';
import * as url from 'url';
import * as path from 'path';
import {AbsolutePath, PackagePath} from '@lit-labs/analyzer';
import {createUpdatingPackageAnalyzer} from '@lit-labs/analyzer/package-analyzer.js';
import {OverlayFilesystem} from '../../lib/overlay-filesystem.js';

const testFilesDir = url.fileURLToPath(
  new URL('../../test_files', import.meta.url)
);

const createPlugin = async () => {
  const {filesystem: fs, buffers} = OverlayFilesystem.fromUnderlyingFilesystem(
    ts.sys
  );
  const analyzer = createUpdatingPackageAnalyzer(testFilesDir as AbsolutePath, {
    fs,
  });
  const workspaceFolder = {
    uri: {fsPath: testFilesDir},
  } as any;
  const plugin = new PassThroughPlugin(analyzer, workspaceFolder);
  return {plugin, analyzer, buffers};
};

suite('PassThroughPlugin', () => {
  test('can get a transformed file', async () => {
    const {plugin} = await createPlugin();
    const js = plugin.getJSFromAnalyzer('/hello.js' as PackagePath);

    const expectedContents = await readFile(
      path.join(testFilesDir, 'hello.golden.js'),
      {
        encoding: 'utf-8',
      }
    );

    assert.equal(js, expectedContents);
  });

  test('sees updates to a file', async () => {
    const tsPath = path.join(testFilesDir, 'hello.ts') as AbsolutePath;
    const packagePath = '/hello.js' as PackagePath;
    const expectedDefaultContents = await readFile(
      path.join(testFilesDir, 'hello.golden.js'),
      {
        encoding: 'utf-8',
      }
    );
    const firstContents = 'export const hello = 1;\n';
    const updatedContents = 'export const hello = 2;\n';

    const {plugin, buffers} = await createPlugin();
    assert.equal(
      plugin.getJSFromAnalyzer(packagePath),
      expectedDefaultContents
    );

    buffers.set(tsPath, firstContents);
    assert.equal(plugin.getJSFromAnalyzer(packagePath), firstContents);

    buffers.set(tsPath, updatedContents);
    assert.equal(plugin.getJSFromAnalyzer(packagePath), updatedContents);

    buffers.close(tsPath);
    assert.equal(
      plugin.getJSFromAnalyzer(packagePath),
      expectedDefaultContents
    );
  });
});
