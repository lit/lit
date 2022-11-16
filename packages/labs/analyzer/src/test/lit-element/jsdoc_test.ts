/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {suite} from 'uvu';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import {fileURLToPath} from 'url';
import {getSourceFilename, languages} from '../utils.js';

import {
  createPackageAnalyzer,
  Analyzer,
  AbsolutePath,
  LitElementDeclaration,
} from '../../index.js';

for (const lang of languages) {
  const test = suite<{
    analyzer: Analyzer;
    packagePath: AbsolutePath;
    element: LitElementDeclaration;
  }>(`LitElement event tests (${lang})`);

  test.before((ctx) => {
    try {
      const packagePath = fileURLToPath(
        new URL(`../../test-files/${lang}/jsdoc`, import.meta.url).href
      ) as AbsolutePath;
      const analyzer = createPackageAnalyzer(packagePath);

      const result = analyzer.getPackage();
      const elementAModule = result.modules.find(
        (m) => m.sourcePath === getSourceFilename('element-a', lang)
      );
      const element = elementAModule!.declarations.filter((d) =>
        d.isLitElementDeclaration()
      )[0] as LitElementDeclaration;

      ctx.packagePath = packagePath;
      ctx.analyzer = analyzer;
      ctx.element = element;
    } catch (error) {
      // Uvu has a bug where it silently ignores failures in before and after,
      // see https://github.com/lukeed/uvu/issues/191.
      console.error('uvu before error', error);
      process.exit(1);
    }
  });

  // slots

  test('slots - Correct number found', ({element}) => {
    assert.equal(element.slots.size, 5);
  });

  test('slots - basic', ({element}) => {
    const slot = element.slots.get('basic');
    assert.ok(slot);
    assert.equal(slot.summary, undefined);
    assert.equal(slot.description, undefined);
  });

  test('slots - with-summary', ({element}) => {
    const slot = element.slots.get('with-summary');
    assert.ok(slot);
    assert.equal(slot.summary, 'Summary for with-summary');
    assert.equal(slot.description, undefined);
  });

  test('slots - with-summary-dash', ({element}) => {
    const slot = element.slots.get('with-summary-dash');
    assert.ok(slot);
    assert.equal(slot.summary, 'Summary for with-summary-dash');
    assert.equal(slot.description, undefined);
  });

  test('slots - with-summary-colon', ({element}) => {
    const slot = element.slots.get('with-summary-colon');
    assert.ok(slot);
    assert.equal(slot.summary, 'Summary for with-summary-colon');
    assert.equal(slot.description, undefined);
  });

  test('slots - with-description', ({element}) => {
    const slot = element.slots.get('with-description');
    assert.ok(slot);
    assert.equal(slot.summary, 'Summary for with-description');
    assert.equal(
      slot.description,
      'Description for with-description\nMore description for with-description\n\nEven more description for with-description'
    );
  });

  // cssParts

  test('cssParts - Correct number found', ({element}) => {
    assert.equal(element.cssParts.size, 5);
  });

  test('cssParts - basic', ({element}) => {
    const part = element.cssParts.get('basic');
    assert.ok(part);
    assert.equal(part.summary, undefined);
    assert.equal(part.description, undefined);
  });

  test('cssParts - with-summary', ({element}) => {
    const part = element.cssParts.get('with-summary');
    assert.ok(part);
    assert.equal(part.summary, 'Summary for :part(with-summary)');
    assert.equal(part.description, undefined);
  });

  test('cssParts - with-summary-dash', ({element}) => {
    const part = element.cssParts.get('with-summary-dash');
    assert.ok(part);
    assert.equal(part.summary, 'Summary for :part(with-summary-dash)');
    assert.equal(part.description, undefined);
  });

  test('cssParts - with-summary-colon', ({element}) => {
    const part = element.cssParts.get('with-summary-colon');
    assert.ok(part);
    assert.equal(part.summary, 'Summary for :part(with-summary-colon)');
    assert.equal(part.description, undefined);
  });

  test('cssParts - with-description', ({element}) => {
    const part = element.cssParts.get('with-description');
    assert.ok(part);
    assert.equal(part.summary, 'Summary for :part(with-description)');
    assert.equal(
      part.description,
      'Description for :part(with-description)\nMore description for :part(with-description)\n\nEven more description for :part(with-description)'
    );
  });

  // cssProperties

  test('cssProperties - Correct number found', ({element}) => {
    assert.equal(element.cssProperties.size, 10);
  });

  test('cssProperties - basic', ({element}) => {
    const prop = element.cssProperties.get('--basic');
    assert.ok(prop);
    assert.equal(prop.summary, undefined);
    assert.equal(prop.description, undefined);
  });

  test('cssProperties - with-summary', ({element}) => {
    const prop = element.cssProperties.get('--with-summary');
    assert.ok(prop);
    assert.equal(prop.summary, 'Summary for --with-summary');
    assert.equal(prop.description, undefined);
  });

  test('cssProperties - with-summary-colon', ({element}) => {
    const prop = element.cssProperties.get('--with-summary-colon');
    assert.ok(prop);
    assert.equal(prop.summary, 'Summary for --with-summary-colon');
    assert.equal(prop.description, undefined);
  });

  test('cssProperties - with-summary-dash', ({element}) => {
    const prop = element.cssProperties.get('--with-summary-dash');
    assert.ok(prop);
    assert.equal(prop.summary, 'Summary for --with-summary-dash');
    assert.equal(prop.description, undefined);
  });

  test('cssProperties - with-description', ({element}) => {
    const prop = element.cssProperties.get('--with-description');
    assert.ok(prop);
    assert.equal(prop.summary, 'Summary for --with-description');
    assert.equal(
      prop.description,
      'Description for --with-description\nMore description for --with-description\n\nEven more description for --with-description'
    );
  });

  test('cssProperties - short-basic', ({element}) => {
    const prop = element.cssProperties.get('--short-basic');
    assert.ok(prop);
    assert.equal(prop.summary, undefined);
    assert.equal(prop.description, undefined);
  });

  test('cssProperties - short-with-summary', ({element}) => {
    const prop = element.cssProperties.get('--short-with-summary');
    assert.ok(prop);
    assert.equal(prop.summary, 'Summary for --short-with-summary');
    assert.equal(prop.description, undefined);
  });

  test('cssProperties - short-with-summary-colon', ({element}) => {
    const prop = element.cssProperties.get('--short-with-summary-colon');
    assert.ok(prop);
    assert.equal(prop.summary, 'Summary for --short-with-summary-colon');
    assert.equal(prop.description, undefined);
  });

  test('cssProperties - short-with-summary-dash', ({element}) => {
    const prop = element.cssProperties.get('--short-with-summary-dash');
    assert.ok(prop);
    assert.equal(prop.summary, 'Summary for --short-with-summary-dash');
    assert.equal(prop.description, undefined);
  });

  test('cssProperties - short-with-description', ({element}) => {
    const prop = element.cssProperties.get('--short-with-description');
    assert.ok(prop);
    assert.equal(prop.summary, 'Summary for --short-with-description');
    assert.equal(
      prop.description,
      'Description for --short-with-description\nMore description for --short-with-description\n\nEven more description for --short-with-description'
    );
  });

  test.run();
}
