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

  test('slots - with-description-colon', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    const slot = element.slots.get('with-description-colon');
    assert.ok(slot);
    assert.equal(slot.summary, undefined);
    assert.equal(slot.description, 'Description for with-description-colon');
  });

  test('slots - with-summary', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    const slot = element.slots.get('with-summary');
    assert.ok(slot);
    assert.equal(slot.summary, 'Summary for with-summary');
    assert.equal(
      slot.description,
      'Description for with-summary\nMore description for with-summary\n\nEven more description for with-summary'
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

  test('cssParts - with-description-colon', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    const part = element.cssParts.get('with-description-colon');
    assert.ok(part);
    assert.equal(part.summary, undefined);
    assert.equal(
      part.description,
      'Description for :part(with-description-colon)'
    );
  });

  test('cssParts - with-summary', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    const part = element.cssParts.get('with-summary');
    assert.ok(part);
    assert.equal(part.summary, 'Summary for :part(with-summary)');
    assert.equal(
      part.description,
      'Description for :part(with-summary)\nMore description for :part(with-summary)\n\nEven more description for :part(with-summary)'
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

  test('cssProperties - with-description-colon', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    const prop = element.cssProperties.get('--with-description-colon');
    assert.ok(prop);
    assert.equal(prop.summary, undefined);
    assert.equal(prop.description, 'Description for --with-description-colon');
  });

  test('cssProperties - with-description-dash', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    const prop = element.cssProperties.get('--with-description-dash');
    assert.ok(prop);
    assert.equal(prop.summary, undefined);
    assert.equal(prop.description, 'Description for --with-description-dash');
  });

  test('cssProperties - with-summary', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    const prop = element.cssProperties.get('--with-summary');
    assert.ok(prop);
    assert.equal(prop.summary, 'Summary for --with-summary');
    assert.equal(
      prop.description,
      'Description for --with-summary\nMore description for --with-summary\n\nEven more description for --with-summary'
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

  test('cssProperties - short-with-description-colon', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    const prop = element.cssProperties.get('--short-with-description-colon');
    assert.ok(prop);
    assert.equal(prop.summary, undefined);
    assert.equal(
      prop.description,
      'Description for --short-with-description-colon'
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

  test('cssProperties - short-with-summary', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    const prop = element.cssProperties.get('--short-with-summary');
    assert.ok(prop);
    assert.equal(prop.summary, 'Summary for --short-with-summary');
    assert.equal(
      prop.description,
      'Description for --short-with-summary\nMore description for --short-with-summary\n\nEven more description for --short-with-summary'
    );
  });

  // Class description, summary, deprecated

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

  // Fields

  test('field1', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isClassDeclaration());
    const member = element.getField('field1');
    assert.ok(member?.isClassField());
    assert.equal(member.summary, `Class field 1 summary\nwith wraparound`);
    assert.equal(
      member.description,
      `Class field 1 description\nwith wraparound`
    );
    assert.equal(member.default, `'default1'`);
    assert.equal(member.privacy, 'private');
    assert.equal(member.type?.text, 'string');
  });

  test('field2', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isClassDeclaration());
    const member = element.getField('field2');
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
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isClassDeclaration());
    const member = element.getField('field3');
    assert.ok(member?.isClassField());
    assert.equal(member.summary, `Class field 3 summary\nwith wraparound`);
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
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isClassDeclaration());
    const member = element.getField('field4');
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

  // Methods

  test('method1', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isClassDeclaration());
    const member = element.getMethod('method1');
    assert.ok(member?.isClassMethod());
    assert.equal(member.summary, `Method 1 summary\nwith wraparound`);
    assert.equal(member.description, `Method 1 description\nwith wraparound`);
    assert.equal(member.parameters?.length, 0);
    assert.equal(member.return?.type?.text, 'void');
  });

  test('method2', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isClassDeclaration());
    const member = element.getMethod('method2');
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
    assert.equal(
      member.parameters?.[1].summary,
      'Param b summary\nwith wraparound'
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
    assert.equal(member.return?.summary, 'Method 2 return summary');
    assert.equal(member.return?.description, 'Method 2 return description');
    assert.equal(member.deprecated, 'Method 2 deprecated');
  });

  test.run();
}
