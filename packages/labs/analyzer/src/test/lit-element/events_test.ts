/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {suite} from 'uvu';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import * as path from 'path';
import {fileURLToPath} from 'url';

import {Analyzer} from '../../lib/analyzer.js';
import {AbsolutePath} from '../../lib/paths.js';
import {LitElementDeclaration} from '../../lib/model.js';

const test = suite<{
  analyzer: Analyzer;
  packagePath: AbsolutePath;
  element: LitElementDeclaration;
}>('LitElement event tests');

test.before((ctx) => {
  try {
    const packagePath = fileURLToPath(
      new URL('../../test-files/events', import.meta.url).href
    ) as AbsolutePath;
    const analyzer = new Analyzer(packagePath);

    const result = analyzer.analyzePackage();
    const elementAModule = result.modules.find(
      (m) => m.sourcePath === path.normalize('src/element-a.ts')
    );
    const element = elementAModule!.declarations[0] as LitElementDeclaration;

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

test('Correct number of events found', ({element}) => {
  assert.equal(element.events.size, 6);
});

test('Just event name', ({element}) => {
  const event = element.events.get('event');
  assert.ok(event);
  assert.equal(event.name, 'event');
  assert.equal(event.description, undefined);
});

test('Event with description', ({element}) => {
  const event = element.events.get('event-two');
  assert.ok(event);
  assert.equal(event.name, 'event-two');
  assert.equal(event.description, 'This is an event');
});

test('Event with dash-separated description', ({element}) => {
  const event = element.events.get('event-three');
  assert.ok(event);
  assert.equal(event.name, 'event-three');
  assert.equal(event.description, 'This is another event');
});

test('Event with type', ({element}) => {
  const event = element.events.get('typed-event');
  assert.ok(event);
  assert.equal(event.name, 'typed-event');
  assert.equal(event.typeString, 'MouseEvent');
  assert.equal(event.description, undefined);
});

test('Event with type and description', ({element}) => {
  const event = element.events.get('typed-event-two');
  assert.ok(event);
  assert.equal(event.name, 'typed-event-two');
  assert.equal(event.typeString, 'MouseEvent');
  assert.equal(event.description, 'This is a typed event');
});

test('Event with type and dash-separated description', ({element}) => {
  const event = element.events.get('typed-event-three');
  assert.ok(event);
  assert.equal(event.name, 'typed-event-three');
  assert.equal(event.typeString, 'MouseEvent');
  assert.equal(event.description, 'This is another typed event');
});

test.run();
