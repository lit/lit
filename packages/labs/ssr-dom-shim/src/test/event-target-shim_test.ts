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

interface EventPathEntry {
  id: string;
  capture: boolean;
  eventPhase: number;
  targetId: string | null;
}

const eventName = 'test';
const {AT_TARGET, BUBBLING_PHASE, CAPTURING_PHASE} = Event;
let nextId = 0;
let eventPath: EventPathEntry[] = [];
const createElementWithListener = () => {
  const el = new HTMLElement() as HTMLElementWithEventMeta;
  const id = (el.id = `${nextId++}`);
  for (const capture of [true, false]) {
    el.addEventListener(
      eventName,
      ({target, eventPhase, currentTarget}) => {
        const targetId = (target as HTMLElement).id;
        eventPath.push({id, capture, eventPhase, targetId});
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
const createElementsWithListener = (amount: number) =>
  Array.from({length: amount}).map(() => createElementWithListener());

test.before.each(() => {
  nextId = 0;
  eventPath = [];
});

test('should handle dispatched event', () => {
  const el = createElementWithListener();
  const result = el.dispatchEvent(new Event(eventName));
  assert.ok(result);
  assert.equal(eventPath, [
    {id: '0', capture: true, eventPhase: AT_TARGET, targetId: el.id},
    {id: '0', capture: false, eventPhase: AT_TARGET, targetId: el.id},
  ] as EventPathEntry[]);
});

test('should ignore preventDefault without cancelable', () => {
  const el = createElementWithListener();
  el.addEventListener(eventName, (e) => e.preventDefault());
  const result = el.dispatchEvent(new Event(eventName));
  assert.ok(result);
});

test('should respect preventDefault with cancelable', () => {
  const el = createElementWithListener();
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
  const [parent, child] = createElementsWithListener(2);
  child.__eventTargetParent = parent;
  const targetId = child.id;
  child.dispatchEvent(new Event(eventName));
  assert.equal(eventPath, [
    {id: '0', capture: true, eventPhase: CAPTURING_PHASE, targetId},
    {id: '1', capture: true, eventPhase: AT_TARGET, targetId},
    {id: '1', capture: false, eventPhase: AT_TARGET, targetId},
  ] as EventPathEntry[]);
});

test('should handle dispatched bubbling event with parent', () => {
  const [parent, child] = createElementsWithListener(2);
  child.__eventTargetParent = parent;
  const targetId = child.id;
  child.dispatchEvent(new Event(eventName, {bubbles: true}));
  assert.equal(eventPath, [
    {id: '0', capture: true, eventPhase: CAPTURING_PHASE, targetId},
    {id: '1', capture: true, eventPhase: AT_TARGET, targetId},
    {id: '1', capture: false, eventPhase: AT_TARGET, targetId},
    {id: '0', capture: false, eventPhase: BUBBLING_PHASE, targetId},
  ] as EventPathEntry[]);
});

test('should handle dispatched bubbling event with parent', () => {
  const [parent, child] = createElementsWithListener(2);
  child.__eventTargetParent = parent;
  const targetId = child.id;
  child.dispatchEvent(new Event(eventName, {bubbles: true}));
  assert.equal(eventPath, [
    {id: '0', capture: true, eventPhase: CAPTURING_PHASE, targetId},
    {id: '1', capture: true, eventPhase: AT_TARGET, targetId},
    {id: '1', capture: false, eventPhase: AT_TARGET, targetId},
    {id: '0', capture: false, eventPhase: BUBBLING_PHASE, targetId},
  ] as EventPathEntry[]);
});

test('should handle stopPropagation during capture phase', () => {
  const [parent, child] = createElementsWithListener(2);
  child.__eventTargetParent = parent;
  let called = false;
  parent.addEventListener(eventName, (e) => e.stopPropagation(), {
    capture: true,
  });
  parent.addEventListener(eventName, () => (called = true), {capture: true});
  const targetId = child.id;
  child.dispatchEvent(new Event(eventName, {bubbles: true}));
  assert.equal(eventPath, [
    {id: '0', capture: true, eventPhase: CAPTURING_PHASE, targetId},
  ] as EventPathEntry[]);
  assert.ok(
    called,
    'Expected event listener after another event listener with stopPropagation to be called'
  );
});

test('should handle stopPropagation during bubbling phase', () => {
  const [parent, child] = createElementsWithListener(2);
  child.__eventTargetParent = parent;
  let called = false;
  child.addEventListener(eventName, (e) => e.stopPropagation());
  child.addEventListener(eventName, () => (called = true));
  const targetId = child.id;
  child.dispatchEvent(new Event(eventName, {bubbles: true}));
  assert.equal(eventPath, [
    {id: '0', capture: true, eventPhase: CAPTURING_PHASE, targetId},
    {id: '1', capture: true, eventPhase: AT_TARGET, targetId},
    {id: '1', capture: false, eventPhase: AT_TARGET, targetId},
  ] as EventPathEntry[]);
  assert.ok(
    called,
    'Expected event listener after another event listener with stopPropagation to be called'
  );
});

test('should handle stopImmediatePropagation during capture phase', () => {
  const [parent, child] = createElementsWithListener(2);
  child.__eventTargetParent = parent;
  let called = false;
  parent.addEventListener(eventName, (e) => e.stopImmediatePropagation(), {
    capture: true,
  });
  parent.addEventListener(eventName, () => (called = true), {capture: true});
  const targetId = child.id;
  child.dispatchEvent(new Event(eventName, {bubbles: true}));
  assert.equal(eventPath, [
    {id: '0', capture: true, eventPhase: CAPTURING_PHASE, targetId},
  ] as EventPathEntry[]);
  assert.not.ok(
    called,
    'Expected event listener after another event listener with stopImmediatePropagation not to be called'
  );
});

test('should handle stopImmediatePropagation during bubbling phase', () => {
  const [parent, child] = createElementsWithListener(2);
  child.__eventTargetParent = parent;
  let called = false;
  child.addEventListener(eventName, (e) => e.stopImmediatePropagation());
  child.addEventListener(eventName, () => (called = true));
  const targetId = child.id;
  child.dispatchEvent(new Event(eventName, {bubbles: true}));
  assert.equal(eventPath, [
    {id: '0', capture: true, eventPhase: CAPTURING_PHASE, targetId},
    {id: '1', capture: true, eventPhase: AT_TARGET, targetId},
    {id: '1', capture: false, eventPhase: AT_TARGET, targetId},
  ] as EventPathEntry[]);
  assert.not.ok(
    called,
    'Expected event listener after another event listener with stopImmediatePropagation not to be called'
  );
});

test('should handle dispatched bubbling event through Shadow DOM', () => {
  // <host id="0">
  //   #shadow-root
  //     <shadowElement="1">
  //       <slot id="2"></slot>
  //     </shadowElement>
  //   <child id="3"></child>
  // </host>
  const [host, shadowElement, slot, child] = createElementsWithListener(4);
  shadowElement.__host = slot.__host = host;
  shadowElement.__eventTargetParent = host;
  slot.__eventTargetParent = shadowElement;
  child.__eventTargetParent = slot;
  const targetId = child.id;
  child.dispatchEvent(new Event(eventName, {bubbles: true}));
  assert.equal(eventPath, [
    {id: '0', capture: true, eventPhase: CAPTURING_PHASE, targetId},
    {id: '1', capture: true, eventPhase: CAPTURING_PHASE, targetId},
    {id: '2', capture: true, eventPhase: CAPTURING_PHASE, targetId},
    {id: '3', capture: true, eventPhase: AT_TARGET, targetId},
    {id: '3', capture: false, eventPhase: AT_TARGET, targetId},
    {id: '2', capture: false, eventPhase: BUBBLING_PHASE, targetId},
    {id: '1', capture: false, eventPhase: BUBBLING_PHASE, targetId},
    {id: '0', capture: false, eventPhase: BUBBLING_PHASE, targetId},
  ] as EventPathEntry[]);
});

test('should handle dispatched bubbling event from Shadow DOM without composed', () => {
  // <host id="0">
  //   #shadow-root
  //     <shadowElement="1">
  //       <slot id="2">
  //         <child id="3"></child>
  //       </slot>
  //     </shadowElement>
  // </host>
  const [host, shadowElement, slot, child] = createElementsWithListener(4);
  shadowElement.__host = slot.__host = child.__host = host;
  shadowElement.__eventTargetParent = host;
  slot.__eventTargetParent = shadowElement;
  child.__eventTargetParent = slot;
  const targetId = child.id;
  child.dispatchEvent(new Event(eventName, {bubbles: true}));
  assert.equal(eventPath, [
    {id: '1', capture: true, eventPhase: CAPTURING_PHASE, targetId},
    {id: '2', capture: true, eventPhase: CAPTURING_PHASE, targetId},
    {id: '3', capture: true, eventPhase: AT_TARGET, targetId},
    {id: '3', capture: false, eventPhase: AT_TARGET, targetId},
    {id: '2', capture: false, eventPhase: BUBBLING_PHASE, targetId},
    {id: '1', capture: false, eventPhase: BUBBLING_PHASE, targetId},
  ] as EventPathEntry[]);
});

test('should handle dispatched bubbling event from Shadow DOM with composed', () => {
  // <host id="0">
  //   #shadow-root
  //     <shadowElement="1">
  //       <slot id="2">
  //         <child id="3"></child>
  //       </slot>
  //     </shadowElement>
  // </host>
  const [host, shadowElement, slot, child] = createElementsWithListener(4);
  shadowElement.__host = slot.__host = child.__host = host;
  shadowElement.__eventTargetParent = host;
  slot.__eventTargetParent = shadowElement;
  child.__eventTargetParent = slot;
  const targetId = child.id;
  child.dispatchEvent(new Event(eventName, {bubbles: true, composed: true}));
  assert.equal(eventPath, [
    {id: '0', capture: true, eventPhase: AT_TARGET, targetId: host.id},
    {id: '1', capture: true, eventPhase: CAPTURING_PHASE, targetId},
    {id: '2', capture: true, eventPhase: CAPTURING_PHASE, targetId},
    {id: '3', capture: true, eventPhase: AT_TARGET, targetId},
    {id: '3', capture: false, eventPhase: AT_TARGET, targetId},
    {id: '2', capture: false, eventPhase: BUBBLING_PHASE, targetId},
    {id: '1', capture: false, eventPhase: BUBBLING_PHASE, targetId},
    {id: '0', capture: false, eventPhase: AT_TARGET, targetId: host.id},
  ] as EventPathEntry[]);
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
    createElementsWithListener(6);
  shadowHost.__host = slot.__host = child.__host = host;
  shadowElement.__host = nestedSlot.__host = shadowHost;
  shadowHost.__eventTargetParent = host;
  shadowElement.__eventTargetParent = shadowHost;
  nestedSlot.__eventTargetParent = shadowElement;
  slot.__eventTargetParent = nestedSlot;
  child.__eventTargetParent = slot;
  const targetId = child.id;
  child.dispatchEvent(new Event(eventName, {bubbles: true, composed: true}));
  assert.equal(eventPath, [
    {id: '0', capture: true, eventPhase: AT_TARGET, targetId: host.id},
    {id: '1', capture: true, eventPhase: CAPTURING_PHASE, targetId},
    {id: '2', capture: true, eventPhase: CAPTURING_PHASE, targetId},
    {id: '3', capture: true, eventPhase: CAPTURING_PHASE, targetId},
    {id: '4', capture: true, eventPhase: CAPTURING_PHASE, targetId},
    {id: '5', capture: true, eventPhase: AT_TARGET, targetId},
    {id: '5', capture: false, eventPhase: AT_TARGET, targetId},
    {id: '4', capture: false, eventPhase: BUBBLING_PHASE, targetId},
    {id: '3', capture: false, eventPhase: BUBBLING_PHASE, targetId},
    {id: '2', capture: false, eventPhase: BUBBLING_PHASE, targetId},
    {id: '1', capture: false, eventPhase: BUBBLING_PHASE, targetId},
    {id: '0', capture: false, eventPhase: AT_TARGET, targetId: host.id},
  ] as EventPathEntry[]);
});

test.run();
