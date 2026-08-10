/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {test} from 'uvu';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import * as fs from 'fs';
// eslint-disable-next-line import/extensions
import {compile, preprocess} from 'svelte/compiler';
import ts from 'typescript';

import {utilTemplate} from '../lib/util-template.js';
import {renderEventsMapper} from '../lib/wrapper-module-template-sfc.js';

// This package compiles with `lib: ["es2021"]` and `types: []`, so the DOM and
// Node globals used below are not declared. Only the members these tests touch
// are described here.
interface FakeEvent {
  type: string;
  detail?: unknown;
}
interface FakeEventTarget {
  addEventListener(type: string, listener: (event: FakeEvent) => void): void;
  removeEventListener(type: string, listener: (event: FakeEvent) => void): void;
  dispatchEvent(event: FakeEvent): boolean;
}
declare const EventTarget: {new (): FakeEventTarget};
declare const CustomEvent: {
  new (type: string, options?: {detail?: unknown}): FakeEvent;
};

type EventHandlers = Record<string, ((event: FakeEvent) => void) | undefined>;
type ForwardEvents = (
  node: FakeEventTarget,
  handlers: EventHandlers
) => {update(handlers: EventHandlers): void; destroy(): void};

/**
 * Loads `forwardEvents` from the generated `util.ts` source itself, so these
 * tests exercise the code the generator actually emits rather than a copy of
 * it. The template is TypeScript, so it is transpiled and imported as a module.
 */
const loadForwardEvents = async (): Promise<ForwardEvents> => {
  const {outputText} = ts.transpileModule(utilTemplate(), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2021,
      module: ts.ModuleKind.ES2020,
    },
  });
  const module = await import(
    `data:text/javascript,${encodeURIComponent(outputText)}`
  );
  return module.forwardEvents as ForwardEvents;
};

/** Builds an events map of the shape `renderEventsMapper` consumes. */
const eventsMap = (...names: string[]) =>
  new Map(names.map((name) => [name, {name}])) as unknown as Parameters<
    typeof renderEventsMapper
  >[0];

/** Compiles markup for a custom element carrying the given attributes. */
const compileWrapper = (attributes: string) =>
  compile(
    `<script>
       let {onInput, onValueChanged} = $props();
       const forwardEvents = () => {};
     </script>
     <element-native-events ${attributes}></element-native-events>`,
    {generate: 'client', runes: true}
  ).js.code;

test('forwards a non-bubbling event that reuses a native event name', async () => {
  const forwardEvents = await loadForwardEvents();
  const node = new EventTarget();
  const calls: unknown[] = [];
  forwardEvents(node, {input: (event) => calls.push(event.detail)});

  // Default options, i.e. `bubbles: false, composed: false`. This is the case
  // Svelte's event delegation misses entirely.
  node.dispatchEvent(new CustomEvent('input', {detail: {value: 1}}));

  assert.equal(calls, [{value: 1}]);
});

test('forwards a kebab-case event name', async () => {
  const forwardEvents = await loadForwardEvents();
  const node = new EventTarget();
  const calls: unknown[] = [];
  forwardEvents(node, {'value-changed': (event) => calls.push(event.detail)});

  node.dispatchEvent(new CustomEvent('value-changed', {detail: {value: 2}}));

  assert.equal(calls, [{value: 2}]);
});

test('dispatches to the handler supplied by the most recent update', async () => {
  const forwardEvents = await loadForwardEvents();
  const node = new EventTarget();
  const first: unknown[] = [];
  const second: unknown[] = [];
  const action = forwardEvents(node, {input: (event) => first.push(event)});

  action.update({input: (event) => second.push(event)});
  node.dispatchEvent(new CustomEvent('input'));

  assert.is(first.length, 0, 'the replaced handler should not be called');
  assert.is(second.length, 1);
});

test('forwards to a handler that was undefined at mount', async () => {
  const forwardEvents = await loadForwardEvents();
  const node = new EventTarget();
  const calls: unknown[] = [];
  // The generated object always carries every event name as a key, but the
  // handler prop itself may be omitted by the consumer.
  const action = forwardEvents(node, {input: undefined});

  node.dispatchEvent(new CustomEvent('input'));
  assert.is(calls.length, 0);

  action.update({input: (event) => calls.push(event)});
  node.dispatchEvent(new CustomEvent('input'));
  assert.is(calls.length, 1);
});

test('removes its listeners on destroy', async () => {
  const forwardEvents = await loadForwardEvents();
  const node = new EventTarget();
  const calls: unknown[] = [];
  const action = forwardEvents(node, {input: (event) => calls.push(event)});

  action.destroy();
  node.dispatchEvent(new CustomEvent('input'));

  assert.is(calls.length, 0);
});

test('renders a single action, quoting keys that need it', () => {
  assert.is(
    renderEventsMapper(eventsMap('input', 'value-changed')),
    `use:forwardEvents={{'input': onInput, 'value-changed': onValueChanged}}`
  );
});

test('renders nothing when the element has no events', () => {
  assert.is(renderEventsMapper(eventsMap()), '');
});

test('compiles to a direct listener rather than a delegated handler', () => {
  const code = compileWrapper(renderEventsMapper(eventsMap('input')));

  assert.ok(code.includes('$.action('), 'expected the action to be applied');
  assert.not.ok(
    code.includes('$.delegated('),
    'the handler must not be registered for delegation'
  );
  assert.not.ok(
    code.includes('$.delegate('),
    'no root delegation should be requested'
  );
});

// Guards the assertion above: without this, the test would still pass if Svelte
// stopped delegating attribute-bound handlers and the check lost its meaning.
test('attribute-bound native events are delegated by Svelte', () => {
  const code = compileWrapper('oninput={onInput}');

  assert.ok(
    code.includes(`$.delegated('input'`),
    'expected Svelte to still delegate attribute-bound native events'
  );
});

test('the generated wrapper compiles without any delegation', async () => {
  const source = fs.readFileSync(
    'goldens/test-element-a/src/lib/ElementNativeEvents.svelte',
    'utf8'
  );
  // `svelte-package` does not strip `lang="ts"`, so the script has to be
  // transpiled before the component can be compiled.
  const {code} = await preprocess(
    source,
    {
      script: ({content}) => ({
        code: ts.transpileModule(content, {
          compilerOptions: {
            target: ts.ScriptTarget.ESNext,
            module: ts.ModuleKind.ESNext,
          },
        }).outputText,
      }),
    },
    {filename: 'ElementNativeEvents.svelte'}
  );
  const compiled = compile(code.replace(' lang="ts"', ''), {
    generate: 'client',
    runes: true,
  });

  assert.ok(compiled.js.code.includes('forwardEvents?.('));
  assert.not.ok(compiled.js.code.includes('$.delegated('));
  assert.not.ok(compiled.js.code.includes('$.delegate('));
  assert.equal(
    compiled.warnings.map((warning) => warning.code),
    []
  );
});

test.run();
