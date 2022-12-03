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

import {createPackageAnalyzer, Module, AbsolutePath} from '../../index.js';

for (const lang of languages) {
  const test = suite<{
    getModule: (name: string) => Module;
  }>(`LitElement event tests (${lang})`);

  test.before((ctx) => {
    try {
      const packagePath = fileURLToPath(
        new URL(`../../test-files/${lang}/jsdoc`, import.meta.url).href
      ) as AbsolutePath;
      const analyzer = createPackageAnalyzer(packagePath);
      ctx.getModule = (name: string) =>
        analyzer.getModule(
          getSourceFilename(
            analyzer.path.join(packagePath, name),
            lang
          ) as AbsolutePath
        );
    } catch (error) {
      // Uvu has a bug where it silently ignores failures in before and after,
      // see https://github.com/lukeed/uvu/issues/191.
      console.error('uvu before error', error);
      process.exit(1);
    }
  });

  // slots

  test('slots - Correct number found', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    assert.equal(element.slots.size, 5);
  });

  test('slots - basic', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    const slot = element.slots.get('basic');
    assert.ok(slot);
    assert.equal(slot.summary, undefined);
    assert.equal(slot.description, undefined);
  });

  test('slots - with-summary', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    const slot = element.slots.get('with-summary');
    assert.ok(slot);
    assert.equal(slot.summary, 'Summary for with-summary');
    assert.equal(slot.description, undefined);
  });

  test('slots - with-summary-dash', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    const slot = element.slots.get('with-summary-dash');
    assert.ok(slot);
    assert.equal(slot.summary, 'Summary for with-summary-dash');
    assert.equal(slot.description, undefined);
  });

  test('slots - with-summary-colon', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    const slot = element.slots.get('with-summary-colon');
    assert.ok(slot);
    assert.equal(slot.summary, 'Summary for with-summary-colon');
    assert.equal(slot.description, undefined);
  });

  test('slots - with-description', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    const slot = element.slots.get('with-description');
    assert.ok(slot);
    assert.equal(slot.summary, 'Summary for with-description');
    assert.equal(
      slot.description,
      'Description for with-description\nMore description for with-description\n\nEven more description for with-description'
    );
  });

  // cssParts

  test('cssParts - Correct number found', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    assert.equal(element.cssParts.size, 5);
  });

  test('cssParts - basic', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    const part = element.cssParts.get('basic');
    assert.ok(part);
    assert.equal(part.summary, undefined);
    assert.equal(part.description, undefined);
  });

  test('cssParts - with-summary', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    const part = element.cssParts.get('with-summary');
    assert.ok(part);
    assert.equal(part.summary, 'Summary for :part(with-summary)');
    assert.equal(part.description, undefined);
  });

  test('cssParts - with-summary-dash', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    const part = element.cssParts.get('with-summary-dash');
    assert.ok(part);
    assert.equal(part.summary, 'Summary for :part(with-summary-dash)');
    assert.equal(part.description, undefined);
  });

  test('cssParts - with-summary-colon', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    const part = element.cssParts.get('with-summary-colon');
    assert.ok(part);
    assert.equal(part.summary, 'Summary for :part(with-summary-colon)');
    assert.equal(part.description, undefined);
  });

  test('cssParts - with-description', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    const part = element.cssParts.get('with-description');
    assert.ok(part);
    assert.equal(part.summary, 'Summary for :part(with-description)');
    assert.equal(
      part.description,
      'Description for :part(with-description)\nMore description for :part(with-description)\n\nEven more description for :part(with-description)'
    );
  });

  // cssProperties

  test('cssProperties - Correct number found', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    assert.equal(element.cssProperties.size, 10);
  });

  test('cssProperties - basic', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    const prop = element.cssProperties.get('--basic');
    assert.ok(prop);
    assert.equal(prop.summary, undefined);
    assert.equal(prop.description, undefined);
  });

  test('cssProperties - with-summary', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    const prop = element.cssProperties.get('--with-summary');
    assert.ok(prop);
    assert.equal(prop.summary, 'Summary for --with-summary');
    assert.equal(prop.description, undefined);
  });

  test('cssProperties - with-summary-colon', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    const prop = element.cssProperties.get('--with-summary-colon');
    assert.ok(prop);
    assert.equal(prop.summary, 'Summary for --with-summary-colon');
    assert.equal(prop.description, undefined);
  });

  test('cssProperties - with-summary-dash', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    const prop = element.cssProperties.get('--with-summary-dash');
    assert.ok(prop);
    assert.equal(prop.summary, 'Summary for --with-summary-dash');
    assert.equal(prop.description, undefined);
  });

  test('cssProperties - with-description', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    const prop = element.cssProperties.get('--with-description');
    assert.ok(prop);
    assert.equal(prop.summary, 'Summary for --with-description');
    assert.equal(
      prop.description,
      'Description for --with-description\nMore description for --with-description\n\nEven more description for --with-description'
    );
  });

  test('cssProperties - short-basic', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    const prop = element.cssProperties.get('--short-basic');
    assert.ok(prop);
    assert.equal(prop.summary, undefined);
    assert.equal(prop.description, undefined);
  });

  test('cssProperties - short-with-summary', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    const prop = element.cssProperties.get('--short-with-summary');
    assert.ok(prop);
    assert.equal(prop.summary, 'Summary for --short-with-summary');
    assert.equal(prop.description, undefined);
  });

  test('cssProperties - short-with-summary-colon', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    const prop = element.cssProperties.get('--short-with-summary-colon');
    assert.ok(prop);
    assert.equal(prop.summary, 'Summary for --short-with-summary-colon');
    assert.equal(prop.description, undefined);
  });

  test('cssProperties - short-with-summary-dash', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    const prop = element.cssProperties.get('--short-with-summary-dash');
    assert.ok(prop);
    assert.equal(prop.summary, 'Summary for --short-with-summary-dash');
    assert.equal(prop.description, undefined);
  });

  test('cssProperties - short-with-description', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    const prop = element.cssProperties.get('--short-with-description');
    assert.ok(prop);
    assert.equal(prop.summary, 'Summary for --short-with-description');
    assert.equal(
      prop.description,
      'Description for --short-with-description\nMore description for --short-with-description\n\nEven more description for --short-with-description'
    );
  });

  // description, summary, deprecated

  test('tagged description and summary', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('TaggedDescription');
    assert.ok(element.isLitElementDeclaration());
    assert.equal(
      element.description,
      `TaggedDescription description. Lorem ipsum dolor sit amet, consectetur
adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna
aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris
nisi ut aliquip ex ea commodo consequat.`
    );
    assert.equal(element.summary, `TaggedDescription summary.`);
    assert.equal(element.deprecated, `TaggedDescription deprecated message.`);
  });

  test('untagged description', ({getModule}) => {
    const element = getModule('element-a').getDeclaration(
      'UntaggedDescription'
    );
    assert.ok(element.isLitElementDeclaration());
    assert.equal(
      element.description,
      `UntaggedDescription description. Lorem ipsum dolor sit amet, consectetur
adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna
aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris
nisi ut aliquip ex ea commodo consequat.`
    );
    assert.equal(element.summary, `UntaggedDescription summary.`);
    assert.equal(element.deprecated, `UntaggedDescription deprecated message.`);
  });

  test('untagged description and summary', ({getModule}) => {
    const element = getModule('element-a').getDeclaration(
      'UntaggedDescSummary'
    );
    assert.ok(element.isLitElementDeclaration());
    assert.equal(
      element.description,
      `UntaggedDescSummary description. Lorem ipsum dolor sit amet, consectetur
adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna
aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris
nisi ut aliquip ex ea commodo consequat.`
    );
    assert.equal(element.summary, `UntaggedDescSummary summary.`);
    assert.equal(element.deprecated, true);
  });

  test.run();
}
