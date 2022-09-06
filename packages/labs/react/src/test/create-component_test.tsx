/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import type {EventName, ReactWebComponent} from '@lit-labs/react';

import {ReactiveElement} from '@lit/reactive-element';
import {property} from '@lit/reactive-element/decorators/property.js';
import {customElement} from '@lit/reactive-element/decorators/custom-element.js';
import type * as ReactModule from 'react';
import 'react/umd/react.development.js';
import 'react-dom/umd/react-dom.development.js';
import {createComponent} from '@lit-labs/react';
import {assert} from '@esm-bundle/chai';

// Needed for JSX expressions
const React = window.React;

interface Foo {
  foo?: boolean;
}

const elementName = 'basic-element';
@customElement(elementName)
class BasicElement extends ReactiveElement {
  @property({type: Boolean})
  bool = false;
  @property({type: String})
  str = '';
  @property({type: Number})
  num = -1;
  @property({type: Object})
  obj: {[index: string]: unknown} | null | undefined = null;
  @property({type: Array})
  arr: unknown[] | null | undefined = null;

  @property({type: Boolean, reflect: true})
  rbool = false;
  @property({type: String, reflect: true})
  rstr = '';
  @property({type: Number, reflect: true})
  rnum = -1;
  @property({type: Object, reflect: true})
  robj: {[index: string]: unknown} | null | undefined = null;
  @property({type: Array, reflect: true})
  rarr: unknown[] | null | undefined = null;

  @property({ type: Object })
  set customAccessors(customAccessors: Foo) {
    const oldValue = this._customAccessors;
    this._customAccessors = customAccessors;
    this.requestUpdate("customAccessors", oldValue);
  }
  get customAccessors(): Foo {
    return this._customAccessors;
  }
  private _customAccessors = {};

  fire(name: string) {
    this.dispatchEvent(new Event(name));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [elementName]: BasicElement;
  }
}

suite('createComponent', () => {
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

  const basicElementEvents = {
    onFoo: 'foo' as EventName<MouseEvent>,
    onBar: 'bar',
  };

  const BasicElementComponent = createComponent(
    window.React,
    elementName,
    BasicElement,
    basicElementEvents
  );

  let el: BasicElement;

  const renderReactComponent = async (
    props?: ReactModule.ComponentProps<typeof BasicElementComponent>
  ) => {
    window.ReactDOM.render(
      <BasicElementComponent {...props}/>,
      container
    );
    el = container.querySelector(elementName)! as BasicElement;
    await el.updateComplete;
  };

  /*
    The following test will not build if an incorrect typing occurs
    when events are not provided to `createComponent`.
  */
  test('renders element without optional event map', async () => {
    const ComponentWithoutEventMap = createComponent(
      window.React,
      elementName,
      BasicElement,
    );

    const name = 'Component without event map.';
    window.ReactDOM.render(
      <ComponentWithoutEventMap>{name}</ComponentWithoutEventMap>,
      container
    );

    el = container.querySelector(elementName)! as BasicElement;
    await el.updateComplete;
    
    assert.equal(el.textContent, 'Component without event map.');
  });

  /*
    The following test will not build if createComponent does return
    the expected type ReactWebComponent<BasicElement>.
  */
  test('renders element with expected type', async () => {
    type TypedComponent = ReactWebComponent<BasicElement>;

    let TypedBasicElement!: TypedComponent;

    // @ts-expect-error
    <TypedBasicElement bool={"string"}></TypedBasicElement>
  });

  test('works with text children', async () => {
    const name = 'World';
    window.ReactDOM.render(
      <BasicElementComponent>Hello {name}</BasicElementComponent>,
      container
    );
    el = container.querySelector(elementName)! as BasicElement;
    await el.updateComplete;
    assert.equal(el.textContent, 'Hello World');
  });

  test('has valid displayName', () => {
    assert.equal(BasicElementComponent.displayName, 'BasicElement');

    const NamedComponent = createComponent(
      window.React,
      elementName,
      BasicElement,
      basicElementEvents,
      'FooBar'
    );

    assert.equal(NamedComponent.displayName, 'FooBar');
  });

  test('wrapper renders custom element that updates', async () => {
    await renderReactComponent();
    assert.isOk(el);
    assert.isOk(el.hasUpdated);
  });

  test('can get ref to element', async () => {
    const elementRef1 = window.React.createRef<BasicElement>();
    renderReactComponent({ref: elementRef1});
    assert.equal(elementRef1.current, el);
    const elementRef2 = window.React.createRef<BasicElement>();
    renderReactComponent({ref: elementRef2});
    assert.equal(elementRef1.current, null);
    assert.equal(elementRef2.current, el);
    renderReactComponent({ref: elementRef1});
    assert.equal(elementRef1.current, el);
    assert.equal(elementRef2.current, null);
  });

  test('ref does not create new attribute on element', async () => {
    await renderReactComponent({ref: undefined});
    const el = container.querySelector(elementName);
    const outerHTML = el?.outerHTML;

    const elementRef1 = window.React.createRef<BasicElement>();
    await renderReactComponent({ref: elementRef1});

    const elAfterRef = container.querySelector(elementName);
    const outerHTMLAfterRef = elAfterRef?.outerHTML;

    assert.equal(outerHTML, outerHTMLAfterRef);
  });

  test('can get ref to element via callbacks', async () => {
    const ref1Calls: Array<string | undefined> = [];
    const refCb1 = (e: Element | null) => ref1Calls.push(e?.localName);
    const ref2Calls: Array<string | undefined> = [];
    const refCb2 = (e: Element | null) => ref2Calls.push(e?.localName);
    renderReactComponent({ref: refCb1});
    assert.deepEqual(ref1Calls, [elementName]);
    renderReactComponent({ref: refCb2});
    assert.deepEqual(ref1Calls, [elementName, undefined]);
    assert.deepEqual(ref2Calls, [elementName]);
    renderReactComponent({ref: refCb1});
    assert.deepEqual(ref1Calls, [elementName, undefined, elementName]);
    assert.deepEqual(ref2Calls, [elementName, undefined]);
  });

  test('can set attributes', async () => {
    await renderReactComponent({id: 'id'});
    assert.equal(el.getAttribute('id'), 'id');
    await renderReactComponent({id: undefined});
    assert.equal(el.getAttribute('id'), null);
    await renderReactComponent({id: 'id2'});
    assert.equal(el.getAttribute('id'), 'id2');
  });

  test('can set properties', async () => {
    let o = {foo: true};
    let a = [1, 2, 3];
    await renderReactComponent({
      bool: true,
      str: 'str',
      num: 5,
      obj: o,
      arr: a,
      customAccessors: o
    });
    assert.equal(el.bool, true);
    assert.equal(el.str, 'str');
    assert.equal(el.num, 5);
    assert.deepEqual(el.obj, o);
    assert.deepEqual(el.arr, a);
    assert.deepEqual(el.customAccessors, o);
    const firstEl = el;
    // update
    o = {foo: false};
    a = [1, 2, 3, 4];
    await renderReactComponent({
      bool: false,
      str: 'str2',
      num: 10,
      obj: o,
      arr: a,
      customAccessors: o
    });
    assert.equal(firstEl, el);
    assert.equal(el.bool, false);
    assert.equal(el.str, 'str2');
    assert.equal(el.num, 10);
    assert.deepEqual(el.obj, o);
    assert.deepEqual(el.arr, a);
    assert.deepEqual(el.customAccessors, o);
  });

  test('can set properties that reflect', async () => {
    let o = {foo: true};
    let a = [1, 2, 3];
    await renderReactComponent({
      rbool: true,
      rstr: 'str',
      rnum: 5,
      robj: o,
      rarr: a,
    });
    const firstEl = el;
    assert.equal(el.rbool, true);
    assert.equal(el.rstr, 'str');
    assert.equal(el.rnum, 5);
    assert.deepEqual(el.robj, o);
    assert.deepEqual(el.rarr, a);
    assert.equal(el.getAttribute('rbool'), '');
    assert.equal(el.getAttribute('rstr'), 'str');
    assert.equal(el.getAttribute('rnum'), '5');
    assert.equal(el.getAttribute('robj'), '{"foo":true}');
    assert.equal(el.getAttribute('rarr'), '[1,2,3]');
    // update
    o = {foo: false};
    a = [1, 2, 3, 4];
    await renderReactComponent({
      rbool: false,
      rstr: 'str2',
      rnum: 10,
      robj: o,
      rarr: a,
    });
    assert.equal(firstEl, el);
    assert.equal(el.rbool, false);
    assert.equal(el.rstr, 'str2');
    assert.equal(el.rnum, 10);
    assert.deepEqual(el.robj, o);
    assert.deepEqual(el.rarr, a);
    assert.equal(el.getAttribute('rbool'), null);
    assert.equal(el.getAttribute('rstr'), 'str2');
    assert.equal(el.getAttribute('rnum'), '10');
    assert.equal(el.getAttribute('robj'), '{"foo":false}');
    assert.equal(el.getAttribute('rarr'), '[1,2,3,4]');
  });

  test('can listen to events', async () => {
    let fooEvent: Event | undefined,
      fooEvent2: Event | undefined,
      barEvent: Event | undefined;
    const onFoo = (e: MouseEvent) => {
      fooEvent = e;
    };
    const onFoo2 = (e: Event) => {
      fooEvent2 = e;
    };
    const onBar = (e: Event) => {
      barEvent = e;
    };
    await renderReactComponent({
      onFoo,
      onBar,
    });
    el.fire('foo');
    assert.equal(fooEvent!.type, 'foo');
    el.fire('bar');
    assert.equal(barEvent!.type, 'bar');
    fooEvent = undefined;
    barEvent = undefined;
    await renderReactComponent({
      onFoo: undefined,
    });
    el.fire('foo');
    assert.equal(fooEvent, undefined);
    el.fire('bar');
    assert.equal(barEvent!.type, 'bar');
    fooEvent = undefined;
    barEvent = undefined;
    await renderReactComponent({
      onFoo,
    });
    el.fire('foo');
    assert.equal(fooEvent!.type, 'foo');
    el.fire('bar');
    assert.equal(barEvent!.type, 'bar');
    await renderReactComponent({
      onFoo: onFoo2,
    });
    fooEvent = undefined;
    fooEvent2 = undefined;
    el.fire('foo');
    assert.equal(fooEvent, undefined);
    assert.equal(fooEvent2!.type, 'foo');
    await renderReactComponent({
      onFoo,
    });
    fooEvent = undefined;
    fooEvent2 = undefined;
    el.fire('foo');
    assert.equal(fooEvent!.type, 'foo');
    assert.equal(fooEvent2, undefined);
  });

  test('can listen to native events', async () => {
    let clickEvent!: React.MouseEvent;
    await renderReactComponent({
      onClick(e: React.MouseEvent) {
        clickEvent = e;
      },
    });
    el.click();
    assert.equal(clickEvent?.type, 'click');
  });

  test('can set children', async () => {
    const children = (window.React.createElement(
      'div'
      // Note, constructing children like this is rare and the React type expects
      // this to be an HTMLCollection even though that's not the output of
      // `createElement`.
    ) as unknown) as HTMLCollection;
    await renderReactComponent({children});
    assert.equal(el.childNodes.length, 1);
    assert.equal(el.firstElementChild!.localName, 'div');
  });

  test('can set reserved React properties', async () => {
    await renderReactComponent({
      style: {display: 'block'},
      className: 'foo bar',
    } as any);
    assert.equal(el.style.display, 'block');
    assert.equal(el.getAttribute('class'), 'foo bar');
  });
});
