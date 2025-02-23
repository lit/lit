/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {suite} from 'uvu';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import {HTMLElement, HTMLElementWithEventMeta} from '@lit-labs/ssr-dom-shim';

const test = suite('Event Target Shim');

const eventName = 'test';
const eventPhases = ['NONE', 'CAPTURING_PHASE', 'AT_TARGET', 'BUBBLING_PHASE'];
// Pattern: element-name:id/capture/eventPhase/target:id
let eventPath: string[] = [];
let nextId = 0;
const createElementWithListener = (localName: string) => {
  const el = new HTMLElement() as HTMLElementWithEventMeta;
  Object.defineProperty(el, 'localName', {
    get() {
      return localName;
    },
  });
  const id = (el.id = `${nextId++}`);
  for (const capture of [true, false]) {
    el.addEventListener(
      eventName,
      ({target, eventPhase, currentTarget}) => {
        const {localName, id: targetId} = target as HTMLElement;
        eventPath.push(
          `${el.localName}:${id}/${capture ? 'capture' : 'non-capture'}/${eventPhases[eventPhase]}/${localName}:${targetId}`
        );
        assert.equal(
          currentTarget,
          el,
          'Expected currentTarget to equal the event listener element'
        );
      },
      {capture}
    );
  }
  return el;
};
const createElementsWithListener = (...localNames: string[]) =>
  localNames.map((n) => createElementWithListener(n));

test.before.each(() => {
  nextId = 0;
  eventPath = [];
});

test('should handle dispatched event', () => {
  const el = createElementWithListener('div');
  const result = el.dispatchEvent(new Event(eventName));
  assert.ok(result);
  assert.equal(eventPath, [
    'div:0/capture/AT_TARGET/div:0',
    'div:0/non-capture/AT_TARGET/div:0',
  ]);
});

test('should ignore preventDefault without cancelable', () => {
  const el = createElementWithListener('div');
  el.addEventListener(eventName, (e) => e.preventDefault());
  const result = el.dispatchEvent(new Event(eventName));
  assert.ok(result);
});

test('should respect preventDefault with cancelable', () => {
  const el = createElementWithListener('div');
  el.addEventListener(eventName, (e) => e.preventDefault());
  const result = el.dispatchEvent(new Event(eventName, {cancelable: true}));
  assert.not.ok(result);
});

test('should match event and target', () => {
  const el = new HTMLElement();
  const event = new Event(eventName);
  let eventCounter = 0;
  el.addEventListener(eventName, (e) => {
    eventCounter++;
    assert.equal(e, event, 'Expected event to equal to the dispatched event');
    assert.equal(
      e.target,
      el,
      'Expected event target to be the dispatching element'
    );
  });
  el.dispatchEvent(event);
  assert.equal(
    eventCounter,
    1,
    'Expected the event handler to have been called exactly once'
  );
});

test('should handle dispatched non-bubbling event with parent', () => {
  const [parent, child] = createElementsWithListener('parent', 'child');
  child.__eventTargetParent = parent;
  child.dispatchEvent(new Event(eventName));
  assert.equal(eventPath, [
    'parent:0/capture/CAPTURING_PHASE/child:1',
    'child:1/capture/AT_TARGET/child:1',
    'child:1/non-capture/AT_TARGET/child:1',
  ]);
});

test('should handle dispatched bubbling event with parent', () => {
  const [parent, child] = createElementsWithListener('parent', 'child');
  child.__eventTargetParent = parent;
  child.dispatchEvent(new Event(eventName, {bubbles: true}));
  assert.equal(eventPath, [
    'parent:0/capture/CAPTURING_PHASE/child:1',
    'child:1/capture/AT_TARGET/child:1',
    'child:1/non-capture/AT_TARGET/child:1',
    'parent:0/non-capture/BUBBLING_PHASE/child:1',
  ]);
});

test('should handle stopPropagation during capture phase', () => {
  const [parent, child] = createElementsWithListener('parent', 'child');
  child.__eventTargetParent = parent;
  let called = false;
  parent.addEventListener(eventName, (e) => e.stopPropagation(), {
    capture: true,
  });
  parent.addEventListener(eventName, () => (called = true), {capture: true});
  child.dispatchEvent(new Event(eventName, {bubbles: true}));
  assert.equal(eventPath, ['parent:0/capture/CAPTURING_PHASE/child:1']);
  assert.ok(
    called,
    'Expected event listener after another event listener with stopPropagation to be called'
  );
});

test('should handle stopPropagation during bubbling phase', () => {
  const [parent, child] = createElementsWithListener('parent', 'child');
  child.__eventTargetParent = parent;
  let called = false;
  child.addEventListener(eventName, (e) => e.stopPropagation());
  child.addEventListener(eventName, () => (called = true));
  child.dispatchEvent(new Event(eventName, {bubbles: true}));
  assert.equal(eventPath, [
    'parent:0/capture/CAPTURING_PHASE/child:1',
    'child:1/capture/AT_TARGET/child:1',
    'child:1/non-capture/AT_TARGET/child:1',
  ]);
  assert.ok(
    called,
    'Expected event listener after another event listener with stopPropagation to be called'
  );
});

test('should handle stopImmediatePropagation during capture phase', () => {
  const [parent, child] = createElementsWithListener('parent', 'child');
  child.__eventTargetParent = parent;
  let called = false;
  parent.addEventListener(eventName, (e) => e.stopImmediatePropagation(), {
    capture: true,
  });
  parent.addEventListener(eventName, () => (called = true), {capture: true});
  child.dispatchEvent(new Event(eventName, {bubbles: true}));
  assert.equal(eventPath, ['parent:0/capture/CAPTURING_PHASE/child:1']);
  assert.not.ok(
    called,
    'Expected event listener after another event listener with stopImmediatePropagation not to be called'
  );
});

test('should handle stopImmediatePropagation during bubbling phase', () => {
  const [parent, child] = createElementsWithListener('parent', 'child');
  child.__eventTargetParent = parent;
  let called = false;
  child.addEventListener(eventName, (e) => e.stopImmediatePropagation());
  child.addEventListener(eventName, () => (called = true));
  child.dispatchEvent(new Event(eventName, {bubbles: true}));
  assert.equal(eventPath, [
    'parent:0/capture/CAPTURING_PHASE/child:1',
    'child:1/capture/AT_TARGET/child:1',
    'child:1/non-capture/AT_TARGET/child:1',
  ]);
  assert.not.ok(
    called,
    'Expected event listener after another event listener with stopImmediatePropagation not to be called'
  );
});

test('should handle dispatched bubbling event through Shadow DOM', () => {
  // <host id="0">
  //   #shadow-root
  //     <shadowElement id="1">
  //       <slot id="2"></slot>
  //     </shadowElement>
  //   <child id="3"></child>
  // </host>
  const [host, shadowElement, slot, child] = createElementsWithListener(
    'host',
    'shadowElement',
    'slot',
    'child'
  );
  shadowElement.__host = slot.__host = host;
  shadowElement.__eventTargetParent = host;
  slot.__eventTargetParent = shadowElement;
  child.__eventTargetParent = slot;
  child.dispatchEvent(new Event(eventName, {bubbles: true}));
  assert.equal(eventPath, [
    'host:0/capture/CAPTURING_PHASE/child:3',
    'shadowElement:1/capture/CAPTURING_PHASE/child:3',
    'slot:2/capture/CAPTURING_PHASE/child:3',
    'child:3/capture/AT_TARGET/child:3',
    'child:3/non-capture/AT_TARGET/child:3',
    'slot:2/non-capture/BUBBLING_PHASE/child:3',
    'shadowElement:1/non-capture/BUBBLING_PHASE/child:3',
    'host:0/non-capture/BUBBLING_PHASE/child:3',
  ]);
});

test('should handle dispatched bubbling event from Shadow DOM without composed', () => {
  // <host id="0">
  //   #shadow-root
  //     <shadowElement id="1">
  //       <slot id="2">
  //         <child id="3"></child>
  //       </slot>
  //     </shadowElement>
  // </host>
  const [host, shadowElement, slot, child] = createElementsWithListener(
    'host',
    'shadowElement',
    'slot',
    'child'
  );
  shadowElement.__host = slot.__host = child.__host = host;
  shadowElement.__eventTargetParent = host;
  slot.__eventTargetParent = shadowElement;
  child.__eventTargetParent = slot;
  child.dispatchEvent(new Event(eventName, {bubbles: true}));
  assert.equal(eventPath, [
    'shadowElement:1/capture/CAPTURING_PHASE/child:3',
    'slot:2/capture/CAPTURING_PHASE/child:3',
    'child:3/capture/AT_TARGET/child:3',
    'child:3/non-capture/AT_TARGET/child:3',
    'slot:2/non-capture/BUBBLING_PHASE/child:3',
    'shadowElement:1/non-capture/BUBBLING_PHASE/child:3',
  ]);
});

test('should handle dispatched bubbling event from Shadow DOM with composed', () => {
  // <host id="0">
  //   #shadow-root
  //     <shadowElement id="1">
  //       <slot id="2">
  //         <child id="3"></child>
  //       </slot>
  //     </shadowElement>
  // </host>
  const [host, shadowElement, slot, child] = createElementsWithListener(
    'host',
    'shadowElement',
    'slot',
    'child'
  );
  shadowElement.__host = slot.__host = child.__host = host;
  shadowElement.__eventTargetParent = host;
  slot.__eventTargetParent = shadowElement;
  child.__eventTargetParent = slot;
  child.dispatchEvent(new Event(eventName, {bubbles: true, composed: true}));
  assert.equal(eventPath, [
    'host:0/capture/AT_TARGET/host:0',
    'shadowElement:1/capture/CAPTURING_PHASE/child:3',
    'slot:2/capture/CAPTURING_PHASE/child:3',
    'child:3/capture/AT_TARGET/child:3',
    'child:3/non-capture/AT_TARGET/child:3',
    'slot:2/non-capture/BUBBLING_PHASE/child:3',
    'shadowElement:1/non-capture/BUBBLING_PHASE/child:3',
    'host:0/non-capture/AT_TARGET/host:0',
  ]);
});

test('should handle dispatched bubbling event from nested Shadow DOM with composed', () => {
  // <host id="0">
  //   #shadow-root
  //     <shadowHost id="1">
  //       #shadow-root
  //         <shadowElement id="2">
  //           <slot id="3"></slot> // nestedSlot
  //         </shadowElement>
  //       <slot id="4">
  //         <child id="5"></child>
  //       </slot>
  //     </shadowHost>
  // </host>
  const [host, shadowHost, shadowElement, nestedSlot, slot, child] =
    createElementsWithListener(
      'host',
      'shadowHost',
      'shadowElement',
      'slot',
      'slot',
      'child'
    );
  shadowHost.__host = slot.__host = child.__host = host;
  shadowElement.__host = nestedSlot.__host = shadowHost;
  shadowHost.__eventTargetParent = host;
  shadowElement.__eventTargetParent = shadowHost;
  nestedSlot.__eventTargetParent = shadowElement;
  slot.__eventTargetParent = nestedSlot;
  child.__eventTargetParent = slot;
  child.dispatchEvent(new Event(eventName, {bubbles: true, composed: true}));
  assert.equal(eventPath, [
    'host:0/capture/AT_TARGET/host:0',
    'shadowHost:1/capture/CAPTURING_PHASE/child:5',
    'shadowElement:2/capture/CAPTURING_PHASE/child:5',
    'slot:3/capture/CAPTURING_PHASE/child:5',
    'slot:4/capture/CAPTURING_PHASE/child:5',
    'child:5/capture/AT_TARGET/child:5',
    'child:5/non-capture/AT_TARGET/child:5',
    'slot:4/non-capture/BUBBLING_PHASE/child:5',
    'slot:3/non-capture/BUBBLING_PHASE/child:5',
    'shadowElement:2/non-capture/BUBBLING_PHASE/child:5',
    'shadowHost:1/non-capture/BUBBLING_PHASE/child:5',
    'host:0/non-capture/AT_TARGET/host:0',
  ]);
});

test.run();
