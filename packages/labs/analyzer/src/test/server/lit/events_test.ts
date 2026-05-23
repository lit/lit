/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as assert from 'node:assert';
import {describe as suite, test} from 'node:test';
import {LitElementDeclaration} from '../../../lib/model.js';
import {languages, setupAnalyzerForTestWithModule} from '../utils.js';

for (const lang of languages) {
  suite(`LitElement event tests (${lang})`, () => {
    const {module} = setupAnalyzerForTestWithModule(
      lang,
      'events',
      'element-a'
    );
    const element = module.declarations.find((d) =>
      d.isLitElementDeclaration()
    ) as LitElementDeclaration;

    test('Correct number of events found', () => {
      assert.equal(element.events.size, 17);
    });

    test('Just event name', () => {
      const event = element.events.get('event');
      assert.ok(event);
      assert.equal(event.name, 'event');
      assert.equal(event.description, undefined);
    });

    test('Event with description', () => {
      const event = element.events.get('event-two');
      assert.ok(event);
      assert.equal(event.name, 'event-two');
      assert.equal(event.description, 'This is an event');
    });

    test('Event with dash-separated description', () => {
      const event = element.events.get('event-three');
      assert.ok(event);
      assert.equal(event.name, 'event-three');
      assert.equal(event.description, 'This is another event');
    });

    test('Event with type', () => {
      const event = element.events.get('typed-event');
      assert.ok(event);
      assert.equal(event.name, 'typed-event');
      assert.equal(event.type?.text, 'MouseEvent');
      assert.equal(event.description, undefined);
      assert.equal(event.type?.references[0].name, 'MouseEvent');
      assert.equal(event.type?.references[0].isGlobal, true);
    });

    test('Event with well-formed type', () => {
      const event = element.events.get('ordered-typed-event');
      assert.ok(event);
      assert.equal(event.name, 'ordered-typed-event');
      assert.equal(event.type?.text, 'MouseEvent');
      assert.equal(event.description, undefined);
      assert.equal(event.type?.references[0].name, 'MouseEvent');
      assert.equal(event.type?.references[0].isGlobal, true);
    });

    test('Event with type and description', () => {
      const event = element.events.get('typed-event-two');
      assert.ok(event);
      assert.equal(event.name, 'typed-event-two');
      assert.equal(event.type?.text, 'MouseEvent');
      assert.equal(event.description, 'This is a typed event');
    });

    test('Event with well-formed type and description', () => {
      const event = element.events.get('ordered-typed-event-two');
      assert.ok(event);
      assert.equal(event.name, 'ordered-typed-event-two');
      assert.equal(event.type?.text, 'MouseEvent');
      assert.equal(event.description, 'This is a typed event');
    });

    test('Event with type and dash-separated description', () => {
      const event = element.events.get('typed-event-three');
      assert.ok(event);
      assert.equal(event.name, 'typed-event-three');
      assert.equal(event.type?.text, 'MouseEvent');
      assert.equal(event.description, 'This is another typed event');
    });

    test('Event with well-formed type and dash-separated description', () => {
      const event = element.events.get('ordered-typed-event-three');
      assert.ok(event);
      assert.equal(event.name, 'ordered-typed-event-three');
      assert.equal(event.type?.text, 'MouseEvent');
      assert.equal(event.description, 'This is another typed event');
    });

    test('Event with local custom event type', () => {
      const event = element.events.get('local-custom-event');
      assert.ok(event);
      assert.equal(event.type?.text, 'LocalCustomEvent');
      assert.equal(
        event.type?.references[0].package,
        '@lit-internal/test-events'
      );
      assert.equal(event.type?.references[0].module, 'element-a.js');
      assert.equal(event.type?.references[0].name, 'LocalCustomEvent');
      assert.equal(event.description, 'Local custom event');
    });

    test('Event with local custom event well-formed type', () => {
      const event = element.events.get('ordered-local-custom-event');
      assert.ok(event);
      assert.equal(event.type?.text, 'LocalCustomEvent');
      assert.equal(
        event.type?.references[0].package,
        '@lit-internal/test-events'
      );
      assert.equal(event.type?.references[0].module, 'element-a.js');
      assert.equal(event.type?.references[0].name, 'LocalCustomEvent');
      assert.equal(event.description, 'Local custom event');
    });

    test('Event with imported custom event type', () => {
      const event = element.events.get('external-custom-event');
      assert.ok(event);
      assert.equal(event.type?.text, 'ExternalCustomEvent');
      assert.equal(
        event.type?.references[0].package,
        '@lit-internal/test-events'
      );
      assert.equal(event.type?.references[0].module, 'custom-event.js');
      assert.equal(event.type?.references[0].name, 'ExternalCustomEvent');
      assert.equal(event.description, 'External custom event');
    });

    test('Event with imported custom event well-formed type', () => {
      const event = element.events.get('ordered-external-custom-event');
      assert.ok(event);
      assert.equal(event.type?.text, 'ExternalCustomEvent');
      assert.equal(
        event.type?.references[0].package,
        '@lit-internal/test-events'
      );
      assert.equal(event.type?.references[0].module, 'custom-event.js');
      assert.equal(event.type?.references[0].name, 'ExternalCustomEvent');
      assert.equal(event.description, 'External custom event');
    });

    test('Event with generic custom event type', () => {
      const event = element.events.get('generic-custom-event');
      assert.ok(event);
      assert.equal(event.type?.text, 'CustomEvent<ExternalClass>');
      assert.equal(event.type?.references[0].name, 'CustomEvent');
      assert.equal(event.type?.references[0].isGlobal, true);
      assert.equal(
        event.type?.references[1].package,
        '@lit-internal/test-events'
      );
      assert.equal(event.type?.references[1].module, 'custom-event.js');
      assert.equal(event.type?.references[1].name, 'ExternalClass');
      assert.equal(event.description, 'Generic custom event');
    });

    test('Event with generic custom event well-formed type', () => {
      const event = element.events.get('ordered-generic-custom-event');
      assert.ok(event);
      assert.equal(event.type?.text, 'CustomEvent<ExternalClass>');
      assert.equal(event.type?.references[0].name, 'CustomEvent');
      assert.equal(event.type?.references[0].isGlobal, true);
      assert.equal(
        event.type?.references[1].package,
        '@lit-internal/test-events'
      );
      assert.equal(event.type?.references[1].module, 'custom-event.js');
      assert.equal(event.type?.references[1].name, 'ExternalClass');
      assert.equal(event.description, 'Generic custom event');
    });

    test('Event with custom event type with inline detail', () => {
      const event = element.events.get('inline-detail-custom-event');
      assert.ok(event);
      assert.equal(
        event.type?.text,
        'CustomEvent<{ event: MouseEvent; more: { impl: ExternalClass; }; }>'
      );
      assert.equal(event.type?.references[0].name, 'CustomEvent');
      assert.equal(event.type?.references[0].isGlobal, true);
      assert.equal(event.type?.references[1].name, 'MouseEvent');
      assert.equal(event.type?.references[1].isGlobal, true);
      assert.equal(
        event.type?.references[2].package,
        '@lit-internal/test-events'
      );
      assert.equal(event.type?.references[2].module, 'custom-event.js');
      assert.equal(event.type?.references[2].name, 'ExternalClass');
      assert.equal(
        event.description,
        'Inline\ndetail custom event description'
      );
    });

    test('Event with custom event well-formed type with inline detail', () => {
      const event = element.events.get('ordered-inline-detail-custom-event');
      assert.ok(event);
      assert.equal(
        event.type?.text,
        'CustomEvent<{ event: MouseEvent; more: { impl: ExternalClass; }; }>'
      );
      assert.equal(event.type?.references[0].name, 'CustomEvent');
      assert.equal(event.type?.references[0].isGlobal, true);
      assert.equal(event.type?.references[1].name, 'MouseEvent');
      assert.equal(event.type?.references[1].isGlobal, true);
      assert.equal(
        event.type?.references[2].package,
        '@lit-internal/test-events'
      );
      assert.equal(event.type?.references[2].module, 'custom-event.js');
      assert.equal(event.type?.references[2].name, 'ExternalClass');
      assert.equal(
        event.description,
        'Inline\ndetail custom event description'
      );
    });
  });
}
