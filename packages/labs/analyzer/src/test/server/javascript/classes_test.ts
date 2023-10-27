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
  const test = suite<AnalyzerTestContext>(`Class tests (${lang})`);

  test.before((ctx) => {
    setupAnalyzerForTest(ctx, lang, 'classes');
  });

  // Class description, summary, deprecated

  test('tagged description and summary', ({getModule}) => {
    const dec = getModule('classes').getDeclaration('TaggedDescription');
    assert.ok(dec.isClassDeclaration());
    assert.equal(
      dec.description,
      `TaggedDescription description. Lorem ipsum dolor sit amet, consectetur
adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna
aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris
nisi ut aliquip ex ea commodo consequat.`
    );
    assert.equal(dec.summary, `TaggedDescription summary.`);
    assert.equal(dec.deprecated, `TaggedDescription deprecated message.`);
  });

  test('untagged description', ({getModule}) => {
    const dec = getModule('classes').getDeclaration('UntaggedDescription');
    assert.ok(dec.isClassDeclaration());
    assert.equal(
      dec.description,
      `UntaggedDescription description. Lorem ipsum dolor sit amet, consectetur
adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna
aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris
nisi ut aliquip ex ea commodo consequat.`
    );
    assert.equal(dec.summary, `UntaggedDescription summary.`);
    assert.equal(dec.deprecated, `UntaggedDescription deprecated message.`);
  });

  // Fields

  test('field1', ({getModule}) => {
    const dec = getModule('classes').getDeclaration('Class1');
    assert.ok(dec.isClassDeclaration());
    const member = dec.getField('field1');
    assert.ok(member?.isClassField());
    assert.equal(
      member.description,
      `Class field 1 description\nwith wraparound`
    );
    assert.equal(member.default, `'default1'`);
    assert.equal(member.privacy, 'private');
    assert.equal(member.type?.text, 'string');
  });

  test('field2', ({getModule}) => {
    const dec = getModule('classes').getDeclaration('Class1');
    assert.ok(dec.isClassDeclaration());
    const member = dec.getField('field2');
    assert.ok(member?.isClassField());
    assert.equal(member.summary, `Class field 2 summary\nwith wraparound`);
    assert.equal(
      member.description,
      `Class field 2 description\nwith wraparound`
    );
    assert.equal(member.default, undefined);
    assert.equal(member.privacy, 'protected');
    assert.equal(member.type?.text, 'string | number');
  });

  test('field3', ({getModule}) => {
    const dec = getModule('classes').getDeclaration('Class1');
    assert.ok(dec.isClassDeclaration());
    const member = dec.getField('field3');
    assert.ok(member?.isClassField());
    assert.equal(
      member.description,
      `Class field 3 description\nwith wraparound`
    );
    assert.equal(member.default, undefined);
    assert.equal(member.privacy, 'public');
    assert.equal(member.type?.text, 'string');
    assert.equal(member.deprecated, true);
  });

  test('field4', ({getModule}) => {
    const dec = getModule('classes').getDeclaration('Class1');
    assert.ok(dec.isClassDeclaration());
    const member = dec.getField('field4');
    assert.ok(member?.isClassField());
    assert.equal(member.summary, `Class field 4 summary\nwith wraparound`);
    assert.equal(
      member.description,
      `Class field 4 description\nwith wraparound`
    );
    assert.equal(
      member.default,
      `new Promise${lang === 'ts' ? '<void>' : ''}((r) => r())`
    );
    assert.equal(member.type?.text, 'Promise<void>');
    assert.equal(member.deprecated, 'Class field 4 deprecated');
  });

  test('#privateField', ({getModule}) => {
    const dec = getModule('classes').getDeclaration('Class1');
    assert.ok(dec.isClassDeclaration());
    const member = dec.getField('#privateField');
    assert.ok(member?.isClassField(), 'is class field');
    assert.equal(member.description, 'ecma private field');
    assert.equal(member.default, `'private'`);
    assert.equal(member.privacy, 'private');
    assert.equal(member.type?.text, 'string');
  });

  test('static field1', ({getModule}) => {
    const dec = getModule('classes').getDeclaration('Class1');
    assert.ok(dec.isClassDeclaration());
    const member = dec.getStaticField('field1');
    assert.ok(member?.isClassField());
    assert.equal(member.summary, `Static class field 1 summary`);
    assert.equal(member.description, `Static class field 1 description`);
    assert.equal(member.default, undefined);
    assert.equal(member.privacy, 'protected');
    assert.equal(member.type?.text, 'string | number');
  });

  // Methods

  test('method1', ({getModule}) => {
    const dec = getModule('classes').getDeclaration('Class1');
    assert.ok(dec.isClassDeclaration());
    const member = dec.getMethod('method1');
    assert.ok(member?.isClassMethod());
    assert.equal(member.description, `Method 1 description\nwith wraparound`);
    assert.equal(member.parameters?.length, 0);
    assert.equal(member.return?.type?.text, 'void');
  });

  test('method2', ({getModule}) => {
    const dec = getModule('classes').getDeclaration('Class1');
    assert.ok(dec.isClassDeclaration());
    const member = dec.getMethod('method2');
    assert.ok(member?.isClassMethod());
    assert.equal(member.summary, `Method 2 summary\nwith wraparound`);
    assert.equal(member.description, `Method 2 description\nwith wraparound`);
    assert.equal(member.parameters?.length, 3);
    assert.equal(member.parameters?.[0].name, 'a');
    assert.equal(member.parameters?.[0].description, 'Param a description');
    assert.equal(member.parameters?.[0].summary, undefined);
    assert.equal(member.parameters?.[0].type?.text, 'string');
    assert.equal(member.parameters?.[0].default, undefined);
    assert.equal(member.parameters?.[0].rest, false);
    assert.equal(member.parameters?.[1].name, 'b');
    assert.equal(
      member.parameters?.[1].description,
      'Param b description\nwith wraparound'
    );
    assert.equal(member.parameters?.[1].type?.text, 'boolean');
    assert.equal(member.parameters?.[1].optional, true);
    assert.equal(member.parameters?.[1].default, 'false');
    assert.equal(member.parameters?.[1].rest, false);
    assert.equal(member.parameters?.[2].name, 'c');
    assert.equal(member.parameters?.[2].description, 'Param c description');
    assert.equal(member.parameters?.[2].summary, undefined);
    assert.equal(member.parameters?.[2].type?.text, 'number[]');
    assert.equal(member.parameters?.[2].optional, false);
    assert.equal(member.parameters?.[2].default, undefined);
    assert.equal(member.parameters?.[2].rest, true);
    assert.equal(member.return?.type?.text, 'string');
    assert.equal(member.return?.description, 'Method 2 return description');
    assert.equal(member.deprecated, 'Method 2 deprecated');
  });

  test('static method1', ({getModule}) => {
    const dec = getModule('classes').getDeclaration('Class1');
    assert.ok(dec.isClassDeclaration());
    const member = dec.getStaticMethod('method1');
    assert.ok(member?.isClassMethod());
    assert.equal(member.summary, `Static method 1 summary`);
    assert.equal(member.description, `Static method 1 description`);
    assert.equal(member.parameters?.length, 3);
    assert.equal(member.parameters?.[0].name, 'a');
    assert.equal(member.parameters?.[0].description, 'Param a description');
    assert.equal(member.parameters?.[0].summary, undefined);
    assert.equal(member.parameters?.[0].type?.text, 'string');
    assert.equal(member.parameters?.[0].default, undefined);
    assert.equal(member.parameters?.[0].rest, false);
    assert.equal(member.parameters?.[1].name, 'b');
    assert.equal(member.parameters?.[1].description, 'Param b description');
    assert.equal(member.parameters?.[1].type?.text, 'boolean');
    assert.equal(member.parameters?.[1].optional, true);
    assert.equal(member.parameters?.[1].default, 'false');
    assert.equal(member.parameters?.[1].rest, false);
    assert.equal(member.parameters?.[2].name, 'c');
    assert.equal(member.parameters?.[2].description, 'Param c description');
    assert.equal(member.parameters?.[2].summary, undefined);
    assert.equal(member.parameters?.[2].type?.text, 'number[]');
    assert.equal(member.parameters?.[2].optional, false);
    assert.equal(member.parameters?.[2].default, undefined);
    assert.equal(member.parameters?.[2].rest, true);
    assert.equal(member.return?.type?.text, 'string');
    assert.equal(
      member.return?.description,
      'Static method 1 return description'
    );
    assert.equal(member.deprecated, 'Static method 1 deprecated');
  });

  test('#privateMethod', ({getModule}) => {
    const dec = getModule('classes').getDeclaration('Class1');
    assert.ok(dec.isClassDeclaration());
    const member = dec.getMethod('#privateMethod');
    assert.ok(member?.isClassMethod());
    assert.equal(member.description, 'ecma private method');
    assert.equal(member.privacy, 'private');
    assert.equal(member.parameters?.length, 1);
    assert.equal(member.return?.type?.text, 'void');
  });

  test('superClass', ({getModule}) => {
    const dec = getModule('classes').getDeclaration('Class1');
    assert.ok(dec.isClassDeclaration());
    const superClassRef = dec.heritage.superClass;
    assert.ok(superClassRef);
    assert.equal(superClassRef.package, '@lit-internal/test-classes');
    assert.equal(superClassRef.module, 'classes.js');
    assert.equal(superClassRef.name, 'BaseClass');
    const superClass = superClassRef.dereference();
    assert.ok(superClass.isClassDeclaration());
    assert.equal(superClass.name, 'BaseClass');
  });

  test('ConstClass', ({getModule}) => {
    const dec = getModule('classes').getDeclaration('ConstClass');
    assert.equal(dec.name, 'ConstClass');
    assert.equal(dec.description, 'ConstClass description');
    assert.ok(dec.isClassDeclaration());
    const field = dec.getField('field1');
    assert.ok(field?.isClassField());
    assert.equal(field.description, 'ConstClass field 1 description');
    const method = dec.getMethod('method1');
    assert.ok(method?.isClassMethod());
    assert.equal(method.description, 'ConstClass method 1 description');
  });

  test('ConstClassNoName', ({getModule}) => {
    const dec = getModule('classes').getDeclaration('ConstClassNoName');
    assert.equal(dec.name, 'ConstClassNoName');
    assert.equal(dec.description, 'ConstClassNoName description');
    assert.ok(dec.isClassDeclaration());
    const field = dec.getField('field1');
    assert.ok(field?.isClassField());
    assert.equal(field.description, 'ConstClassNoName field 1 description');
    const method = dec.getMethod('method1');
    assert.ok(method?.isClassMethod());
    assert.equal(method.description, 'ConstClassNoName method 1 description');
  });

  test('default class', ({getModule}) => {
    const dec = getModule('classes').getDeclaration('default');
    assert.equal(dec.name, 'default');
    assert.equal(dec.description, 'default class description');
    assert.ok(dec.isClassDeclaration());
    const field = dec.getField('field1');
    assert.ok(field?.isClassField());
    assert.equal(field.description, 'default class field 1 description');
    const method = dec.getMethod('method1');
    assert.ok(method?.isClassMethod());
    assert.equal(method.description, 'default class method 1 description');
  });

  test.run();
}
