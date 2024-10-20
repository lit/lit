/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import type {EventName, ReactWebComponent, WebComponentProps} from '@lit/react';

import {ReactiveElement} from '@lit/reactive-element';
import {property} from '@lit/reactive-element/decorators/property.js';
import {customElement} from '@lit/reactive-element/decorators/custom-element.js';
import * as React from 'react';
// eslint-disable-next-line import/extensions
import {createRoot, Root} from 'react-dom/client';
// eslint-disable-next-line import/extensions
import {act} from 'react-dom/test-utils';

import {createComponent} from '@lit/react';
import {assert} from 'chai';

const DEV_MODE = !!ReactiveElement.enableWarning;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

declare global {
  interface HTMLElementTagNameMap {
    [tagName]: BasicElement;
    'x-foo': XFoo;
  }
}

declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'x-foo': WebComponentProps<XFoo>;
    }
  }
}

interface Foo {
  foo?: boolean;
}

@customElement('x-foo')
class XFoo extends ReactiveElement {}

const tagName = 'basic-element';
@customElement(tagName)
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

  // override a default property
  @property({type: Boolean})
  disabled = false;

  // override a react reserved property
  @property({type: Boolean})
  ref = false;

  // override a react reserved property
  @property({type: String})
  override localName = 'basic-element';

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

  @property({type: Object})
  set customAccessors(customAccessors: Foo) {
    const oldValue = this._customAccessors;
    this._customAccessors = customAccessors;
    this.requestUpdate('customAccessors', oldValue);
  }
  get customAccessors(): Foo {
    return this._customAccessors;
  }
  private _customAccessors = {};

  fire(name: string) {
    this.dispatchEvent(new Event(name));
  }
}

let root: Root;
let container: HTMLElement;

const basicElementEvents = {
  onFoo: 'foo' as EventName<MouseEvent>,
  onBar: 'bar',
};

const BasicElementComponent = createComponent({
  react: React,
  elementClass: BasicElement,
  events: basicElementEvents,
  tagName,
});

const render = (children: React.ReactNode) => {
  act(() => {
    root.render(children);
  });
};

if (DEV_MODE) {
  suite('Developer mode warnings', () => {
    let warnings: string[] = [];
    const consoleWarn = console.warn;

    suiteSetup(() => {
      console.warn = (message: string) => warnings.push(message);
    });

    suiteTeardown(() => {
      console.warn = consoleWarn;
    });

    setup(() => {
      warnings = [];
    });

    test('warns when react reserved properties are used', () => {
      createComponent({
        react: React,
        elementClass: BasicElement,
        events: basicElementEvents,
        tagName,
      });

      // We only expect a warning for ref and not localName
      // since we don't warn on overrides of HTMLElement properties
      // that React treats specially.
      assert.equal(warnings.length, 1);
    });
  });
}

suite('createComponent', () => {
  setup(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  teardown(() => {
    if (root) {
      act(() => {
        root.unmount();
      });
    }
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  test('renders element without optional event map', async () => {
    const ComponentWithoutEventMap = createComponent({
      react: React,
      elementClass: BasicElement,
      tagName,
    });

    const text = 'Component without event map.';

    render(<ComponentWithoutEventMap>{text}</ComponentWithoutEventMap>);

    const el = container.querySelector(tagName)!;
    await el.updateComplete;

    assert.equal(el.textContent, text);
  });

  // Type only test to be caught at build time.
  test.skip('Wrapped component should accept props with correct types', async () => {
    const TypedBasicElementComponent = {} as ReactWebComponent<BasicElement>;

    <TypedBasicElementComponent str="str" bool={true} num={1} />;

    // @ts-expect-error bool prop only accepts boolean
    <TypedBasicElementComponent bool={'string'} />;
  });

  // Type only test to be caught at build time.
  test.skip('WebComponentProps type allows "ref"', async () => {
    <x-foo ref={React.createRef()}></x-foo>;
  });

  // Type only test to be caught at build time.
  test.skip('Prefer passed in events over built-in React event types', async () => {
    const TestComponent = createComponent({
      react: React,
      tagName: 'event-component',
      elementClass: class EventComponent extends ReactiveElement {},
      events: {
        onInput: 'input' as EventName<CustomEvent<string>>,
      },
    });

    // onInput handler below should not error
    <TestComponent
      onInput={(e: CustomEvent<string>) => {
        console.log(e);
      }}
    />;
  });

  // Type only test to be caught at build time.
  test.skip('Prefer element property type over built-in HTMLAttributes', async () => {
    const TestComponent = createComponent({
      react: React,
      tagName: 'my-component',
      elementClass: class MyComponent extends ReactiveElement {
        color: number = 0;
      },
    });

    // `color` is `string | undefined` in React.HTMLAttributes.
    // It should be happy with number though because that's how it's typed in
    // the element above.
    <TestComponent color={1} />;

    // @ts-expect-error color prop should not accept string anymore
    <TestComponent color={'string'} />;
  });

  test('works with text children', async () => {
    const name = 'World';

    render(<BasicElementComponent>Hello {name}</BasicElementComponent>);

    const el = container.querySelector(tagName)!;
    await el.updateComplete;

    assert.equal(el.textContent, 'Hello World');
  });

  test('has valid displayName', () => {
    assert.equal(BasicElementComponent.displayName, 'BasicElement');

    const NamedComponent = createComponent({
      react: React,
      elementClass: BasicElement,
      events: basicElementEvents,
      displayName: 'FooBar',
      tagName,
    });

    assert.equal(NamedComponent.displayName, 'FooBar');
  });

  test('wrapper renders custom element that updates', async () => {
    render(<BasicElementComponent />);
    const el = container.querySelector(tagName)!;
    assert.isOk(el);
    await el.updateComplete;
    assert.isOk(el.hasUpdated);
  });

  test('can get ref to element', async () => {
    const elementRef1 = React.createRef<BasicElement>();
    render(<BasicElementComponent ref={elementRef1} />);
    assert.equal(elementRef1.current, container.querySelector(tagName));

    const elementRef2 = React.createRef<BasicElement>();
    render(<BasicElementComponent ref={elementRef2} />);
    assert.equal(elementRef1.current, null);
    assert.equal(elementRef2.current, container.querySelector(tagName));

    render(<BasicElementComponent ref={elementRef1} />);
    assert.equal(elementRef1.current, container.querySelector(tagName));
    assert.equal(elementRef2.current, null);
  });

  test('ref does not create new attribute on element', async () => {
    render(<BasicElementComponent ref={undefined} />);
    const el = container.querySelector(tagName)!;
    const outerHTML = el.outerHTML;
    const elementRef1 = React.createRef<BasicElement>();
    render(<BasicElementComponent ref={elementRef1} />);
    const elAfterRef = container.querySelector(tagName)!;
    const outerHTMLAfterRef = elAfterRef.outerHTML;

    assert.equal(outerHTML, outerHTMLAfterRef);
  });

  test('can get ref to element via callbacks', async () => {
    const ref1Calls: Array<string | undefined> = [];
    const refCb1 = (e: Element | null) => ref1Calls.push(e?.localName);
    const ref2Calls: Array<string | undefined> = [];
    const refCb2 = (e: Element | null) => ref2Calls.push(e?.localName);
    render(<BasicElementComponent ref={refCb1} />);
    assert.deepEqual(ref1Calls, [tagName]);
    render(<BasicElementComponent ref={refCb2} />);
    assert.deepEqual(ref1Calls, [tagName, undefined]);
    assert.deepEqual(ref2Calls, [tagName]);
    render(<BasicElementComponent ref={refCb1} />);
    assert.deepEqual(ref1Calls, [tagName, undefined, tagName]);
    assert.deepEqual(ref2Calls, [tagName, undefined]);
  });

  /**
   * The following are testing parity of behavior against native elements in
   * React on DOM reflecting attributes
   */

  for (const name of ['div', tagName]) {
    const Tag = name === tagName ? BasicElementComponent : name;
    let el: HTMLDivElement | BasicElement;

    test(`${name}: can set/unset attributes`, async () => {
      render(<Tag />);
      el = container.querySelector(name)!;
      assert.equal(el.getAttribute('id'), null);
      assert.equal(el.id, '');

      render(<Tag id="foo" />);
      assert.equal(el.getAttribute('id'), 'foo');
      assert.equal(el.id, 'foo');

      render(<Tag />);
      assert.equal(el.getAttribute('id'), null);
      assert.equal(el.id, '');

      render(<Tag id="bar" />);
      assert.equal(el.getAttribute('id'), 'bar');
      assert.equal(el.id, 'bar');

      // TS doesn't like it but React can unset with `null` too
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render(<Tag id={null as any} />);
      assert.equal(el.getAttribute('id'), null);
      assert.equal(el.id, '');

      render(<Tag id="baz" />);
      assert.equal(el.getAttribute('id'), 'baz');
      assert.equal(el.id, 'baz');
    });

    test(`${name}: set/unset boolean attributes`, async () => {
      render(<Tag />);
      el = container.querySelector(name)!;
      assert.equal(el.getAttribute('hidden'), null);
      assert.equal(el.hidden, false);

      render(<Tag hidden />);
      assert.equal(el.getAttribute('hidden'), '');
      assert.equal(el.hidden, true);

      render(<Tag hidden={false} />);
      assert.equal(el.getAttribute('hidden'), null);
      assert.equal(el.hidden, false);

      render(<Tag hidden />);
      assert.equal(el.getAttribute('hidden'), '');
      assert.equal(el.hidden, true);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render(<Tag hidden={null as any} />);
      assert.equal(el.getAttribute('hidden'), null);
      assert.equal(el.hidden, false);

      render(<Tag hidden />);
      assert.equal(el.getAttribute('hidden'), '');
      assert.equal(el.hidden, true);

      render(<Tag />);
      assert.equal(el.getAttribute('hidden'), null);
      assert.equal(el.hidden, false);

      render(<Tag hidden />);
      assert.equal(el.getAttribute('hidden'), '');
      assert.equal(el.hidden, true);
    });

    test(`${name}: set/unset enumerated attributes`, async () => {
      render(<Tag />);
      el = container.querySelector(name)!;
      assert.equal(el.getAttribute('draggable'), null);
      assert.equal(el.draggable, false);

      render(<Tag draggable />);
      assert.equal(el.getAttribute('draggable'), 'true');
      assert.equal(el.draggable, true);

      render(<Tag draggable={false} />);
      assert.equal(el.getAttribute('draggable'), 'false');
      assert.equal(el.draggable, false);

      render(<Tag draggable />);
      assert.equal(el.getAttribute('draggable'), 'true');
      assert.equal(el.draggable, true);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render(<Tag draggable={null as any} />);
      assert.equal(el.getAttribute('draggable'), null);
      assert.equal(el.draggable, false);

      render(<Tag draggable />);
      assert.equal(el.getAttribute('draggable'), 'true');
      assert.equal(el.draggable, true);

      render(<Tag />);
      assert.equal(el.getAttribute('draggable'), null);
      assert.equal(el.draggable, false);

      render(<Tag draggable="true" />);
      assert.equal(el.getAttribute('draggable'), 'true');
      assert.equal(el.draggable, true);

      // The following test fails for basic-element only
      // See https://github.com/lit/lit/issues/4391
      if (name !== tagName) {
        render(<Tag draggable="false" />);
        assert.equal(el.getAttribute('draggable'), 'false');
        assert.equal(el.draggable, false);
      }
    });

    test(`${name}: sets/unsets boolean aria attributes`, async () => {
      render(<Tag />);
      el = container.querySelector(name)!;
      assert.equal(el.getAttribute('aria-checked'), null);

      render(<Tag aria-checked />);
      assert.equal(el.getAttribute('aria-checked'), 'true');

      render(<Tag aria-checked={false} />);
      assert.equal(el.getAttribute('aria-checked'), 'false');

      render(<Tag aria-checked />);
      assert.equal(el.getAttribute('aria-checked'), 'true');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render(<Tag aria-checked={null as any} />);
      assert.equal(el.getAttribute('aria-checked'), null);

      render(<Tag aria-checked />);
      assert.equal(el.getAttribute('aria-checked'), 'true');

      render(<Tag />);
      assert.equal(el.getAttribute('aria-checked'), null);
    });
  }

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

    render(<BasicElementComponent onFoo={onFoo} onBar={onBar} />);
    const el = container.querySelector(tagName)!;
    el.fire('foo');
    assert.equal(fooEvent!.type, 'foo');
    el.fire('bar');
    assert.equal(barEvent!.type, 'bar');
    fooEvent = undefined;
    barEvent = undefined;

    // Clear listener
    // Explicitly setting `undefined` or omitting prop will clear listeners
    render(<BasicElementComponent onFoo={undefined} />);
    el.fire('foo');
    assert.equal(fooEvent, undefined);
    el.fire('bar');
    assert.equal(barEvent, undefined);
    fooEvent = undefined;
    barEvent = undefined;

    // Reattach listener
    render(<BasicElementComponent onFoo={onFoo} />);
    el.fire('foo');
    assert.equal(fooEvent!.type, 'foo');

    // Replace listener
    render(<BasicElementComponent onFoo={onFoo2} />);
    fooEvent = undefined;
    fooEvent2 = undefined;
    el.fire('foo');
    assert.equal(fooEvent, undefined);
    assert.equal(fooEvent2!.type, 'foo');

    // Replace listener again
    render(<BasicElementComponent onFoo={onFoo} />);
    fooEvent = undefined;
    fooEvent2 = undefined;
    el.fire('foo');
    assert.equal(fooEvent!.type, 'foo');
    assert.equal(fooEvent2, undefined);
  });

  // Regression test for https://github.com/lit/lit/issues/4569
  test('event prop should not be set on instance', async () => {
    const handler = () => {};
    render(<BasicElementComponent onFoo={handler} />);
    const el = container.querySelector(tagName)!;
    assert.notProperty(el, 'onFoo');

    // Render again with the same handler
    render(<BasicElementComponent onFoo={handler} />);
    assert.notProperty(el, 'onFoo');
  });

  test('can listen to native events', async () => {
    let clickEvent!: React.MouseEvent;
    render(
      <BasicElementComponent
        onClick={(e) => {
          clickEvent = e;
        }}
      />
    );
    const el = container.querySelector(tagName)!;
    el.click();
    assert.equal(clickEvent.type, 'click');
  });

  test('can set children', async () => {
    render(
      <BasicElementComponent>
        <div></div>
      </BasicElementComponent>
    );
    const el = document.querySelector(tagName)!;
    assert.equal(el.childNodes.length, 1);
    assert.equal(el.firstElementChild!.localName, 'div');
  });

  test('can set reserved React properties', async () => {
    render(
      <BasicElementComponent style={{display: 'block'}} className="foo bar" />
    );
    const el = document.querySelector(tagName)!;
    assert.equal(el.style.display, 'block');
    assert.equal(el.getAttribute('class'), 'foo bar');
  });
});
