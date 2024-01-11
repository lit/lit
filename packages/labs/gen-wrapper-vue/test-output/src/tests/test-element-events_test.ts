/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {assert} from '@esm-bundle/chai';
import {createApp, reactive, h} from 'vue';
import {
  default as ElementEvents,
  SpecialEvent,
  MyDetail,
  EventSubclass,
  TemplateResult,
} from '@lit-internal/test-element-a-vue/ElementEvents.js';
import {ElementEvents as ElementEventsElement} from '@lit-internal/test-element-a/element-events.js';

suite('test-element-events', () => {
  let container: HTMLElement;

  setup(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  teardown(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  test('can listen to events', async () => {
    let stringCustomEventPayload: CustomEvent<string> | undefined = undefined;
    let numberCustomEventPayload: CustomEvent<number> | undefined = undefined;
    let myDetailCustomEventPayload: CustomEvent<MyDetail> | undefined =
      undefined;
    let templateResultCustomEventPayload:
      | CustomEvent<TemplateResult>
      | undefined = undefined;
    let eventSubclassPayload: EventSubclass | undefined = undefined;
    let specialEventPayload: SpecialEvent | undefined = undefined;

    const props = {
      onStringCustomEvent: (e: CustomEvent<string>) =>
        (stringCustomEventPayload = e),
      onNumberCustomEvent: (e: CustomEvent<number>) =>
        (numberCustomEventPayload = e),
      onMyDetailCustomEvent: (e: CustomEvent<MyDetail>) =>
        (myDetailCustomEventPayload = e),
      onTemplateResultCustomEvent: (e: CustomEvent<TemplateResult>) =>
        (templateResultCustomEventPayload = e),
      onEventSubclass: (e: EventSubclass) => (eventSubclassPayload = e),
      onSpecialEvent: (e: SpecialEvent) => (specialEventPayload = e),
    };

    const reactiveProps = reactive(props);
    createApp({
      render() {
        return h(ElementEvents, reactiveProps);
      },
    }).mount(container);
    const el = container.querySelector(
      'element-events'
    )! as ElementEventsElement;
    await el.updateComplete;
    let expected_stringCustomEventPayload = 'test-detail';
    el.fireStringCustomEvent(expected_stringCustomEventPayload);
    assert.equal(
      stringCustomEventPayload!.detail,
      expected_stringCustomEventPayload
    );
    expected_stringCustomEventPayload = 'test-detail2';
    el.fireStringCustomEvent(expected_stringCustomEventPayload);
    assert.equal(
      stringCustomEventPayload!.detail,
      expected_stringCustomEventPayload
    );
    const expected_numberCustomEventPayload = 55;
    el.fireNumberCustomEvent(expected_numberCustomEventPayload);
    assert.equal(
      numberCustomEventPayload!.detail,
      expected_numberCustomEventPayload
    );
    const expected_myDetailCustomEventPayload: MyDetail = {a: 'aa', b: 555};
    el.fireMyDetailCustomEvent(expected_myDetailCustomEventPayload);
    assert.equal(
      myDetailCustomEventPayload!.detail,
      expected_myDetailCustomEventPayload
    );
    // Note, default payload is html`` which results in {strings: [''], values: []}
    el.fireTemplateResultCustomEvent();
    const {strings, values} = templateResultCustomEventPayload!.detail;
    assert.equal(strings.length, 1);
    assert.equal(strings[0], '');
    assert.equal(values.length, 0);
    const str = 'strstr';
    const num = 5555;
    el.fireEventSubclass(str, num);
    assert.equal(eventSubclassPayload!.aStr, str);
    assert.equal(eventSubclassPayload!.aNumber, num);
    el.fireSpecialEvent(num);
    assert.equal(specialEventPayload!.aNumber, num);
  });
});
