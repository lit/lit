/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {UpdatingElement} from 'updating-element';
import {property} from 'updating-element/decorators/property.js';
import {customElement} from 'updating-element/decorators/customElement.js';
import 'react/umd/react.development.js';
import 'react-dom/umd/react-dom.development.js';
import {createComponent} from '../../../frameworks/react/create-component.js';
// import {generateElementName, nextFrame} from '../../test-helpers.js';
import {assert} from '@esm-bundle/chai';

@customElement('basic-element')
class BasicElement extends UpdatingElement {
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

  fire(name: string) {
    this.dispatchEvent(new Event(name));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'basic-element': BasicElement;
  }
}

suite('React createComponent', () => {
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

  const BasicElementComponent = createComponent<
    BasicElement,
    {
      onFoo: string;
      onBar: string;
    }
  >(window.React, 'basic-element', {
    onFoo: 'foo',
    onBar: 'bar',
  });

  let el: BasicElement;

  const renderReactComponent = async (
    props: React.ComponentProps<typeof BasicElementComponent> = {}
  ) => {
    window.ReactDOM.render(
      window.React.createElement(BasicElementComponent, props),
      container
    );
    el = container.querySelector('basic-element')!;
    await el.updateComplete;
  };

  test(`can create wrapper`, async () => {
    assert.isOk(BasicElementComponent);
  });

  test('wrapper renders custom element that updates', async () => {
    await renderReactComponent();
    assert.isOk(el);
    assert.isOk(el.hasUpdated);
  });

  test('can get ref to element', async () => {
    const elementRef = window.React.createRef();
    renderReactComponent({ref: elementRef});
    assert.equal(elementRef.current, el);
  });

  test('can set attributes', async () => {
    await renderReactComponent({id: 'id'});
    assert.equal(el.getAttribute('id'), 'id');
  });

  test('can set properties', async () => {
    const o = {foo: true};
    const a = [1, 2, 3];
    await renderReactComponent({
      bool: true,
      str: 'str',
      num: 5,
      obj: o,
      arr: a,
    });
    assert.equal(el.bool, true);
    assert.equal(el.str, 'str');
    assert.equal(el.num, 5);
    assert.deepEqual(el.obj, o);
    assert.deepEqual(el.arr, a);
  });

  test('can set properties that reflect', async () => {
    const o = {foo: true};
    const a = [1, 2, 3];
    await renderReactComponent({
      rbool: true,
      rstr: 'str',
      rnum: 5,
      robj: o,
      rarr: a,
    });
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
  });

  test('can update reflecting properties', async () => {
    await renderReactComponent({
      rbool: true,
      rstr: 'str',
      rnum: 5,
      robj: {foo: 1},
      rarr: [1, 2, 3],
    });
    const firstEl = el;
    await renderReactComponent({
      rbool: false,
      rnum: 10,
      robj: {foo: 2},
    });
    assert.equal(firstEl, el);
    assert.equal(el.rbool, false);
    assert.equal(el.rstr, 'str');
    assert.equal(el.rnum, 10);
    assert.deepEqual(el.robj, {foo: 2});
    assert.deepEqual(el.rarr, [1, 2, 3]);
    assert.equal(el.getAttribute('rbool'), null);
    assert.equal(el.getAttribute('rstr'), 'str');
    assert.equal(el.getAttribute('rnum'), '10');
    assert.equal(el.getAttribute('robj'), '{"foo":2}');
    assert.equal(el.getAttribute('rarr'), '[1,2,3]');
  });

  test('can listen to events', async () => {
    let fooEvent: Event | undefined, barEvent: Event | undefined;
    const onFoo = (e: Event) => {
      fooEvent = e;
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
  });
});
