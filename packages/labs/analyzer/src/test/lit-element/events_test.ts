/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {suite} from 'uvu';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import {fileURLToPath} from 'url';

import {Analyzer} from '../../lib/analyzer.js';
import {AbsolutePath} from '../../lib/paths.js';
import {
  LitElementDeclaration,
  isLitElementDeclaration,
} from '../../lib/model.js';

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
      (m) => m.sourcePath === 'src/element-a.ts'
    );
    const element = elementAModule!.declarations.filter(
      isLitElementDeclaration
    )[0] as LitElementDeclaration;

    ctx.packagePath = packagePath;
    ctx.analyzer = analyzer;
    ctx.element = element;
  } catch (e) {
    // Uvu has a bug where it silently ignores failures in before and after,
    // see https://github.com/lukeed/uvu/issues/191.
    console.error(e);
    process.exit(1);
  }
});

test('Correct number of events found', ({element}) => {
  assert.equal(element.events.size, 8);
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
  assert.equal(event.type?.text, 'MouseEvent');
  assert.equal(event.description, undefined);
  assert.equal(event.type?.references[0].name, 'MouseEvent');
  assert.equal(event.type?.references[0].isGlobal, true);
});

test('Event with type and description', ({element}) => {
  const event = element.events.get('typed-event-two');
  assert.ok(event);
  assert.equal(event.name, 'typed-event-two');
  assert.equal(event.type?.text, 'MouseEvent');
  assert.equal(event.description, 'This is a typed event');
});

test('Event with type and dash-separated description', ({element}) => {
  const event = element.events.get('typed-event-three');
  assert.ok(event);
  assert.equal(event.name, 'typed-event-three');
  assert.equal(event.type?.text, 'MouseEvent');
  assert.equal(event.description, 'This is another typed event');
});

test('Event with local custom event type', ({element}) => {
  const localEvent = element.events.get('local-custom-event');
  assert.ok(localEvent);
  assert.equal(localEvent.type?.text, 'LocalCustomEvent');
  assert.equal(
    localEvent.type?.references[0].package,
    '@lit-internal/test-events'
  );
  assert.equal(localEvent.type?.references[0].module, 'element-a.js');
  assert.equal(localEvent.type?.references[0].name, 'LocalCustomEvent');
});

test('Event with imported custom event type', ({element}) => {
  const externalEvent = element.events.get('external-custom-event');
  assert.ok(externalEvent);
  assert.equal(externalEvent.type?.text, 'ExternalCustomEvent');
  assert.equal(
    externalEvent.type?.references[0].package,
    '@lit-internal/test-events'
  );
  assert.equal(externalEvent.type?.references[0].module, 'custom-event.js');
  assert.equal(externalEvent.type?.references[0].name, 'ExternalCustomEvent');
});

test.run();
