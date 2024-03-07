/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * Test with `npm run test -w @lit-labs/ignition`.
 *
 * Update goldens with: `npm run update-goldens -w @lit-labs/ignition`.
 */

import ts from 'typescript';
import {test, describe as suite} from 'node:test';
import * as assert from 'node:assert';
import * as url from 'url';
import * as path from 'path';
import {
  getTemplateNodeBySourceId,
  isElementNode,
  Element,
  isTextNode,
  TextNode,
} from '../../lib/parse-template.js';

type TypeScript = typeof ts;

const testFilesDir = url.fileURLToPath(
  new URL('../../test_files', import.meta.url)
);

const getTestSourceFile = (filename: string) => {
  const program = ts.createProgram({
    rootNames: [filename],
    options: {
      target: ts.ScriptTarget.Latest,
      module: ts.ModuleKind.ES2020,
    },
  });
  const checker = program.getTypeChecker();
  const sourceFile = program.getSourceFile(filename);
  if (sourceFile === undefined) {
    throw new Error(`Test file not found: ${filename}`);
  }
  return {sourceFile, checker};
};

suite('getTemplateNodeBySourceId', () => {
  const testFilePath = path.resolve(testFilesDir, 'hello.ts');
  const {sourceFile, checker} = getTestSourceFile(testFilePath);

  test('0', async () => {
    const {node} = getTemplateNodeBySourceId(sourceFile, 0, ts, checker);

    // Node 0 should be <div>Hello, world!</div>
    assert.ok(node);
    assert.equal(isElementNode(node), true);
    assert.equal(node.nodeName, 'div');
    assert.equal(isTextNode((node as Element).childNodes[0]), true);
    assert.equal(
      ((node as Element).childNodes[0] as TextNode).value,
      'Hello, world!'
    );
  });

  test('9', async () => {
    const {node} = getTemplateNodeBySourceId(sourceFile, 9, ts, checker);

    // Node 9 should be <span>A</span>
    assert.ok(node);
    assert.equal(isElementNode(node), true);
    assert.equal(node.nodeName, 'span');
    assert.equal(isTextNode((node as Element).childNodes[0]), true);
    assert.equal(((node as Element).childNodes[0] as TextNode).value, 'A');
  });
});
