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
  const test = suite<AnalyzerTestContext>(`JSDoc tests (${lang})`);

  test.before((ctx) => {
    setupAnalyzerForTest(ctx, lang, 'jsdoc');
  });

  // slots

  test('slots - Correct number found', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    assert.equal(element.slots.size, 4);
  });

  test('slots - no-description', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    const slot = element.slots.get('no-description');
    assert.ok(slot);
    assert.equal(slot.summary, undefined);
    assert.equal(slot.description, undefined);
  });

  test('slots - with-description', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
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
    assert.ok(element.isLitElementDeclaration());
    const slot = element.slots.get('with-description-dash');
    assert.ok(slot);
    assert.equal(slot.summary, undefined);
    assert.equal(slot.description, 'Description for with-description-dash');
  });

  // cssParts

  test('cssParts - Correct number found', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    assert.equal(element.cssParts.size, 6);
  });

  test('cssParts - no-description', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    const part = element.cssParts.get('no-description');
    assert.ok(part);
    assert.equal(part.summary, undefined);
    assert.equal(part.description, undefined);
  });

  test('cssParts - with-description', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
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
    assert.ok(element.isLitElementDeclaration());
    const part = element.cssParts.get('with-description-dash');
    assert.ok(part);
    assert.equal(part.summary, undefined);
    assert.equal(
      part.description,
      'Description for :part(with-description-dash)'
    );
  });

  test('cssParts - lowercase', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    const part = element.cssParts.get('lower-with-description-dash');
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
    assert.ok(element.isLitElementDeclaration());
    assert.equal(element.cssProperties.size, 22);
  });

  test('cssProperties - no-description', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    const prop = element.cssProperties.get('--no-description');
    assert.ok(prop);
    assert.equal(prop.summary, undefined);
    assert.equal(prop.description, undefined);
  });

  test('cssProperties - lower-no-description', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    const prop = element.cssProperties.get('--lower-no-description');
    assert.ok(prop);
    assert.equal(prop.summary, undefined);
    assert.equal(prop.description, undefined);
  });

  test('cssProperties - with-description', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    const prop = element.cssProperties.get('--with-description');
    assert.ok(prop);
    assert.equal(prop.summary, undefined);
    assert.equal(
      prop.description,
      'Description for --with-description\nwith wraparound'
    );
  });

  test('cssProperties - lower-with-description', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    const prop = element.cssProperties.get('--lower-with-description');
    assert.ok(prop);
    assert.equal(prop.summary, undefined);
    assert.equal(
      prop.description,
      'Description for --lower-with-description\nwith wraparound'
    );
  });

  test('cssProperties - with-description-dash', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    const prop = element.cssProperties.get('--with-description-dash');
    assert.ok(prop);
    assert.equal(prop.summary, undefined);
    assert.equal(prop.description, 'Description for --with-description-dash');
  });

  test('cssProperties - lower-with-description-dash', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    const prop = element.cssProperties.get('--lower-with-description-dash');
    assert.ok(prop);
    assert.equal(prop.summary, undefined);
    assert.equal(
      prop.description,
      'Description for --lower-with-description-dash'
    );
  });

  test('cssProperties - default-no-description', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    const prop = element.cssProperties.get('--default-no-description');
    assert.ok(prop);
    assert.equal(prop.default, '#324fff');
  });

  test('cssProperties - lower-default-no-description', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    const prop = element.cssProperties.get('--lower-default-no-description');
    assert.ok(prop);
    assert.equal(prop.default, '#324fff');
  });

  test('cssProperties - default-with-description', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    const prop = element.cssProperties.get('--default-with-description');
    assert.ok(prop);
    assert.equal(prop.default, '#324fff');
  });

  test('cssProperties - lower-default-with-description', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    const prop = element.cssProperties.get('--lower-default-with-description');
    assert.ok(prop);
    assert.equal(prop.default, '#324fff');
  });

  test('cssProperties - default-with-description-dash', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    const prop = element.cssProperties.get('--default-with-description-dash');
    assert.ok(prop);
    assert.equal(prop.default, '#324fff');
  });

  test('cssProperties - lower-default-with-description-dash', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    const prop = element.cssProperties.get(
      '--lower-default-with-description-dash'
    );
    assert.ok(prop);
    assert.equal(prop.default, '#324fff');
  });

  test('cssProperties - short-no-description', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    const prop = element.cssProperties.get('--short-no-description');
    assert.ok(prop);
    assert.equal(prop.summary, undefined);
    assert.equal(prop.description, undefined);
  });

  test('cssProperties - lower-short-no-description', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    const prop = element.cssProperties.get('--lower-short-no-description');
    assert.ok(prop);
    assert.equal(prop.summary, undefined);
    assert.equal(prop.description, undefined);
  });

  test('cssProperties - short-with-description', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    const prop = element.cssProperties.get('--short-with-description');
    assert.ok(prop);
    assert.equal(prop.summary, undefined);
    assert.equal(
      prop.description,
      'Description for --short-with-description\nwith wraparound'
    );
  });

  test('cssProperties - lower-short-with-description', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    const prop = element.cssProperties.get('--lower-short-with-description');
    assert.ok(prop);
    assert.equal(prop.summary, undefined);
    assert.equal(
      prop.description,
      'Description for --lower-short-with-description\nwith wraparound'
    );
  });

  test('cssProperties - short-with-description-dash', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    const prop = element.cssProperties.get('--short-with-description-dash');
    assert.ok(prop);
    assert.equal(prop.summary, undefined);
    assert.equal(
      prop.description,
      'Description for --short-with-description-dash'
    );
  });

  test('cssProperties - lower-short-with-description-dash', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    const prop = element.cssProperties.get(
      '--lower-short-with-description-dash'
    );
    assert.ok(prop);
    assert.equal(prop.summary, undefined);
    assert.equal(
      prop.description,
      'Description for --lower-short-with-description-dash'
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

  test('cssProperties - syntax-no-description', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    const prop = element.cssProperties.get('--syntax-no-description');
    assert.ok(prop);
    assert.equal(prop.syntax, '<color>');
  });

  test.run();
}
