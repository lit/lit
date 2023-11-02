/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {suite} from 'uvu';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import {
  AnalyzerTestContext,
  languages,
  setupAnalyzerForTest,
} from '../utils.js';

for (const lang of languages) {
  const test = suite<AnalyzerTestContext>(
    `Vanilla element JSDoc tests (${lang})`
  );

  test.before((ctx) => {
    setupAnalyzerForTest(ctx, lang, 'vanilla-jsdoc');
  });

  // slots

  test('slots - Correct number found', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isCustomElementDeclaration());
    assert.equal(element.slots.size, 4);
  });

  test('slots - no-description', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isCustomElementDeclaration());
    const slot = element.slots.get('no-description');
    assert.ok(slot);
    assert.equal(slot.summary, undefined);
    assert.equal(slot.description, undefined);
  });

  test('slots - with-description', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isCustomElementDeclaration());
    const slot = element.slots.get('with-description');
    assert.ok(slot);
    assert.equal(slot.summary, undefined);
    assert.equal(
      slot.description,
      'Description for with-description\nwith wraparound'
    );
  });

  test('slots - with-description-dash', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isCustomElementDeclaration());
    const slot = element.slots.get('with-description-dash');
    assert.ok(slot);
    assert.equal(slot.summary, undefined);
    assert.equal(slot.description, 'Description for with-description-dash');
  });

  // cssParts

  test('cssParts - Correct number found', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isCustomElementDeclaration());
    assert.equal(element.cssParts.size, 3);
  });

  test('cssParts - no-description', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isCustomElementDeclaration());
    const part = element.cssParts.get('no-description');
    assert.ok(part);
    assert.equal(part.summary, undefined);
    assert.equal(part.description, undefined);
  });

  test('cssParts - with-description', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isCustomElementDeclaration());
    const part = element.cssParts.get('with-description');
    assert.ok(part);
    assert.equal(part.summary, undefined);
    assert.equal(
      part.description,
      'Description for :part(with-description)\nwith wraparound'
    );
  });

  test('cssParts - with-description-dash', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isCustomElementDeclaration());
    const part = element.cssParts.get('with-description-dash');
    assert.ok(part);
    assert.equal(part.summary, undefined);
    assert.equal(
      part.description,
      'Description for :part(with-description-dash)'
    );
  });

  // cssProperties

  test('cssProperties - Correct number found', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isCustomElementDeclaration());
    assert.equal(element.cssProperties.size, 12);
  });

  test('cssProperties - no-description', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isCustomElementDeclaration());
    const prop = element.cssProperties.get('--no-description');
    assert.ok(prop);
    assert.equal(prop.summary, undefined);
    assert.equal(prop.description, undefined);
  });

  test('cssProperties - with-description', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isCustomElementDeclaration());
    const prop = element.cssProperties.get('--with-description');
    assert.ok(prop);
    assert.equal(prop.summary, undefined);
    assert.equal(
      prop.description,
      'Description for --with-description\nwith wraparound'
    );
  });

  test('cssProperties - with-description-dash', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isCustomElementDeclaration());
    const prop = element.cssProperties.get('--with-description-dash');
    assert.ok(prop);
    assert.equal(prop.summary, undefined);
    assert.equal(prop.description, 'Description for --with-description-dash');
  });

  test('cssProperties - default-no-description', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isCustomElementDeclaration());
    const prop = element.cssProperties.get('--default-no-description');
    assert.ok(prop);
    assert.equal(prop.default, '#324fff');
  });

  test('cssProperties - default-with-description', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isCustomElementDeclaration());
    const prop = element.cssProperties.get('--default-with-description');
    assert.ok(prop);
    assert.equal(prop.default, '#324fff');
  });

  test('cssProperties - default-with-description-dash', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isCustomElementDeclaration());
    const prop = element.cssProperties.get('--default-with-description-dash');
    assert.ok(prop);
    assert.equal(prop.default, '#324fff');
  });

  test('cssProperties - optional-no-description', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isCustomElementDeclaration());
    const prop = element.cssProperties.get('--optional-no-description');
    assert.ok(prop);
    assert.equal(prop.default, undefined);
  });

  test('cssProperties - optional-with-description', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isCustomElementDeclaration());
    const prop = element.cssProperties.get('--optional-with-description');
    assert.ok(prop);
    assert.equal(prop.default, undefined);
  });

  test('cssProperties - optional-with-description-dash', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isCustomElementDeclaration());
    const prop = element.cssProperties.get('--optional-with-description-dash');
    assert.ok(prop);
    assert.equal(prop.default, undefined);
  });

  test('cssProperties - short-no-description', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isCustomElementDeclaration());
    const prop = element.cssProperties.get('--short-no-description');
    assert.ok(prop);
    assert.equal(prop.summary, undefined);
    assert.equal(prop.description, undefined);
  });

  test('cssProperties - short-with-description', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isCustomElementDeclaration());
    const prop = element.cssProperties.get('--short-with-description');
    assert.ok(prop);
    assert.equal(prop.summary, undefined);
    assert.equal(
      prop.description,
      'Description for --short-with-description\nwith wraparound'
    );
  });

  test('cssProperties - short-with-description-dash', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isCustomElementDeclaration());
    const prop = element.cssProperties.get('--short-with-description-dash');
    assert.ok(prop);
    assert.equal(prop.summary, undefined);
    assert.equal(
      prop.description,
      'Description for --short-with-description-dash'
    );
  });

  test('basic class analysis', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isClassDeclaration());
    assert.equal(element.description, 'A cool custom element.');
    const field = element.getField('field1');
    assert.ok(field?.isClassField());
    assert.equal(field.description, `Class field 1 description`);
    assert.equal(field.type?.text, 'string');
    const method = element.getMethod('method1');
    assert.ok(method?.isClassMethod());
    assert.equal(method.description, `Method 1 description`);
    assert.equal(method.parameters?.length, 0);
    assert.equal(method.return?.type?.text, 'void');
  });

  test.run();
}
