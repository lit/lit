/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import {html, render} from 'lit-html';
import {ref, createRef, RefOrCallback} from 'lit-html/directives/ref.js';
import {assert} from '@esm-bundle/chai';

suite('ref', () => {
  let container: HTMLDivElement;

  setup(() => {
    container = document.createElement('div');
  });

  test('sets a ref on a Ref object', () => {
    const divRef = createRef();
    render(html`<div ${ref(divRef)}></div>`, container);
    const div = container.firstElementChild;
    assert.equal(divRef.value, div);
  });

  test('calls a ref callback', () => {
    let divRef: Element | undefined;
    const divCallback = (el: Element | undefined) => (divRef = el);
    render(html`<div ${ref(divCallback)}></div>`, container);
    const div = container.firstElementChild;
    assert.equal(divRef, div);
  });

  test('handles an undefined ref', () => {
    render(html`<div ${ref(undefined)}></div>`, container);
    const div = container.firstElementChild;
    // Not much to assert. We mainly care that we didn't throw
    assert.isOk(div);
  });

  test('sets a ref when Ref object changes', () => {
    const divRef1 = createRef();
    const divRef2 = createRef();

    const go = (r: RefOrCallback) =>
      render(html`<div ${ref(r)}></div>`, container);
    go(divRef1);
    const div1 = container.firstElementChild;
    assert.equal(divRef1.value, div1);

    go(divRef2);
    const div2 = container.firstElementChild;
    assert.equal(divRef1.value, undefined);
    assert.equal(divRef2.value, div2);
  });

  test('calls a ref callback when callback changes', () => {
    let divRef: Element | undefined;
    const divCallback1 = (el: Element | undefined) => (divRef = el);
    const divCallback2 = (el: Element | undefined) => (divRef = el);

    const go = (r: RefOrCallback) =>
      render(html`<div ${ref(r)}></div>`, container);

    go(divCallback1);
    const div1 = container.firstElementChild;
    assert.equal(divRef, div1);

    go(divCallback2);
    const div2 = container.firstElementChild;
    assert.equal(divRef, div2);
  });

  test('only sets a ref when element changes', () => {
    let queriedEl: Element | null;
    let callCount = 0;
    const elRef = createRef();

    // Patch Ref to observe value changes
    let value: Element | undefined;
    Object.defineProperty(elRef, 'value', {
      set(v: Element | undefined) {
        value = v;
        callCount++;
      },
      get() {
        return value;
      },
    });

    const go = (x: boolean) =>
      render(
        x ? html`<div ${ref(elRef)}></div>` : html`<span ${ref(elRef)}></span>`,
        container
      );

    go(true);
    queriedEl = container.firstElementChild;
    assert.equal(queriedEl?.tagName, 'DIV');
    assert.equal(elRef.value, queriedEl);
    assert.equal(callCount, 1);

    go(true);
    queriedEl = container.firstElementChild;
    assert.equal(queriedEl?.tagName, 'DIV');
    assert.equal(elRef.value, queriedEl);
    assert.equal(callCount, 1);

    go(false);
    queriedEl = container.firstElementChild;
    assert.equal(queriedEl?.tagName, 'SPAN');
    assert.equal(elRef.value, queriedEl);
    assert.equal(callCount, 2);
  });

  test('only calls a ref callback when element changes', () => {
    let queriedEl: Element | null;
    const calls: Array<string | undefined> = [];
    const elCallback = (e: Element | undefined) => {
      calls.push(e?.tagName);
    };
    const go = (x: boolean) =>
      render(
        x
          ? html`<div ${ref(elCallback)}></div>`
          : html`<span ${ref(elCallback)}></span>`,
        container
      );

    go(true);
    queriedEl = container.firstElementChild;
    assert.equal(queriedEl?.tagName, 'DIV');
    assert.deepEqual(calls, ['DIV']);

    go(true);
    queriedEl = container.firstElementChild;
    assert.equal(queriedEl?.tagName, 'DIV');
    assert.deepEqual(calls, ['DIV']);

    go(false);
    queriedEl = container.firstElementChild;
    assert.equal(queriedEl?.tagName, 'SPAN');
    assert.deepEqual(calls, ['DIV', undefined, 'SPAN']);

    go(true);
    queriedEl = container.firstElementChild;
    assert.equal(queriedEl?.tagName, 'DIV');
    assert.deepEqual(calls, ['DIV', undefined, 'SPAN', undefined, 'DIV']);
  });

  test('calls callback bound to options.host', () => {
    class Host {
      bool = false;
      calls: Array<string | undefined> = [];
      root = document.createElement('div');
      elCallback(e: Element | undefined) {
        this.calls.push(e?.tagName);
      }
      render() {
        return render(
          this.bool
            ? html`<div ${ref(this.elCallback)}></div>`
            : html`<span ${ref(this.elCallback)}></span>`,
          this.root,
          {host: this}
        );
      }
    }

    const testRef = (
      host: Host,
      initialCalls: Array<string | undefined> = []
    ) => {
      let queriedEl: Element | null;
      host.bool = true;
      host.render();
      queriedEl = host.root.firstElementChild;
      assert.equal(queriedEl?.tagName, 'DIV');
      assert.deepEqual(host.calls, [...initialCalls, 'DIV']);

      host.bool = true;
      host.render();
      queriedEl = host.root.firstElementChild;
      assert.equal(queriedEl?.tagName, 'DIV');
      assert.deepEqual(host.calls, [...initialCalls, 'DIV']);

      host.bool = false;
      host.render();
      queriedEl = host.root.firstElementChild;
      assert.equal(queriedEl?.tagName, 'SPAN');
      assert.deepEqual(host.calls, [...initialCalls, 'DIV', undefined, 'SPAN']);

      host.bool = true;
      host.render();
      queriedEl = host.root.firstElementChild;
      assert.equal(queriedEl?.tagName, 'DIV');
      assert.deepEqual(host.calls, [
        ...initialCalls,
        'DIV',
        undefined,
        'SPAN',
        undefined,
        'DIV',
      ]);
    };

    // Test first instance
    const host1 = new Host();
    testRef(host1);

    // Test second instance
    const host2 = new Host();
    testRef(host2);

    // Test on first instance again
    // (reset boolean to render SPAN, so we see an initial change
    // back to DIV)
    host1.bool = false;
    host1.render();
    // Add in an undefined call for the initial switch from SPAN back to DIV
    testRef(host1, [...host1.calls, undefined]);
  });

  test('two refs', () => {
    const divRef1 = createRef();
    const divRef2 = createRef();
    render(html`<div ${ref(divRef1)} ${ref(divRef2)}></div>`, container);
    const div = container.firstElementChild;
    assert.equal(divRef1.value, div);
    assert.equal(divRef2.value, div);
  });

  test('two ref callbacks alternating', () => {
    let queriedEl: Element | null;
    const divCalls: Array<string | undefined> = [];
    const divCallback = (e: Element | undefined) => {
      divCalls.push(e?.tagName);
    };
    const spanCalls: Array<string | undefined> = [];
    const spanCallback = (e: Element | undefined) => {
      spanCalls.push(e?.tagName);
    };
    const go = (x: boolean) =>
      render(
        x
          ? html`<div ${ref(divCallback)}></div>`
          : html`<span ${ref(spanCallback)}></span>`,
        container
      );

    go(true);
    queriedEl = container.firstElementChild;
    assert.equal(queriedEl?.tagName, 'DIV');
    assert.deepEqual(divCalls, ['DIV']);
    assert.deepEqual(spanCalls, []);

    go(true);
    queriedEl = container.firstElementChild;
    assert.equal(queriedEl?.tagName, 'DIV');
    assert.deepEqual(divCalls, ['DIV']);
    assert.deepEqual(spanCalls, []);

    go(false);
    queriedEl = container.firstElementChild;
    assert.equal(queriedEl?.tagName, 'SPAN');
    assert.deepEqual(divCalls, ['DIV', undefined]);
    assert.deepEqual(spanCalls, ['SPAN']);

    go(true);
    queriedEl = container.firstElementChild;
    assert.equal(queriedEl?.tagName, 'DIV');
    assert.deepEqual(divCalls, ['DIV', undefined, 'DIV']);
    assert.deepEqual(spanCalls, ['SPAN', undefined]);
  });

  test('refs are always set in tree order', () => {
    const elRef = createRef();
    const go = () =>
      render(
        html`
        <div id="first" ${ref(elRef)}></div>
        <div id="next" ${ref(elRef)}>
          ${html`<span id="last" ${ref(elRef)}></span>`}
        </div>`,
        container
      );

    go();
    assert.equal(elRef.value!.id, 'last');
    go();
    assert.equal(elRef.value!.id, 'last');
  });

  test('callbacks are always called in tree order', () => {
    const calls: Array<string | undefined> = [];
    const elCallback = (e: Element | undefined) => {
      calls.push(e?.id);
    };
    const go = () =>
      render(
        html`
        <div id="first" ${ref(elCallback)}></div>
        <div id="next" ${ref(elCallback)}>
          ${html`<span id="last" ${ref(elCallback)}></span>`}
        </div>`,
        container
      );

    go();
    assert.deepEqual(calls, ['first', undefined, 'next', undefined, 'last']);
    calls.length = 0;
    go();
    assert.deepEqual(calls, [
      undefined,
      'first',
      undefined,
      'next',
      undefined,
      'last',
    ]);
  });

  test('Ref passed to ref directive changes', () => {
    const aRef = createRef();
    const bRef = createRef();
    const go = (x: boolean) =>
      render(html`<div ${ref(x ? aRef : bRef)}></div>`, container);

    go(true);
    assert.equal(aRef.value?.tagName, 'DIV');
    assert.equal(bRef.value, undefined);
    go(false);
    assert.equal(aRef.value, undefined);
    assert.equal(bRef.value?.tagName, 'DIV');
    go(true);
    assert.equal(aRef.value?.tagName, 'DIV');
    assert.equal(bRef.value, undefined);
  });

  test('callback passed to ref directive changes', () => {
    const aCalls: Array<string | undefined> = [];
    const aCallback = (el: Element | undefined) => aCalls.push(el?.tagName);
    const bCalls: Array<string | undefined> = [];
    const bCallback = (el: Element | undefined) => bCalls.push(el?.tagName);
    const go = (x: boolean) =>
      render(html`<div ${ref(x ? aCallback : bCallback)}></div>`, container);

    go(true);
    assert.deepEqual(aCalls, ['DIV']);
    assert.deepEqual(bCalls, []);
    go(false);
    assert.deepEqual(aCalls, ['DIV', undefined]);
    assert.deepEqual(bCalls, ['DIV']);
    go(true);
    assert.deepEqual(aCalls, ['DIV', undefined, 'DIV']);
    assert.deepEqual(bCalls, ['DIV', undefined]);
  });

  test('new callback created each render', () => {
    const calls: Array<string | undefined> = [];
    const go = () =>
      render(
        html`<div ${ref((el) => calls.push(el?.tagName))}></div>`,
        container
      );
    go();
    assert.deepEqual(calls, ['DIV']);
    go();
    assert.deepEqual(calls, ['DIV', undefined, 'DIV']);
    go();
    assert.deepEqual(calls, ['DIV', undefined, 'DIV', undefined, 'DIV']);
  });
});
