/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {assert} from '@esm-bundle/chai';
import {until} from 'lit-html/directives/until.js';
import {html, nothing, render} from 'lit-html';
import {Deferred} from '../test-utils/deferred.js';
import {stripExpressionMarkers} from '@lit-labs/testing';
import {memorySuite} from '../test-utils/memory.js';

const laterTask = () => new Promise((resolve) => setTimeout(resolve));

suite('until directive', () => {
  let container: HTMLDivElement;
  let deferred: Deferred<string>;

  setup(() => {
    container = document.createElement('div');
    deferred = new Deferred<string>();
  });

  test('renders a Promise when it resolves', async () => {
    const deferred = new Deferred<any>();
    render(html`<div>${until(deferred.promise)}</div>`, container);
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');
    deferred.resolve('foo');
    await deferred.promise;
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>foo</div>');
  });

  test('renders non-Promises immediately', async () => {
    const defaultContent = html`<span>loading...</span>`;
    render(
      html`<div>${until(deferred.promise, defaultContent)}</div>`,
      container
    );
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div><span>loading...</span></div>'
    );
    deferred.resolve('foo');
    await deferred.promise;
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>foo</div>');
  });

  test('renders primitive low-priority content only once', async () => {
    const go = () =>
      render(
        html`<div>${until(deferred.promise, 'loading...')}</div>`,
        container
      );

    go();
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div>loading...</div>'
    );
    deferred.resolve('foo');
    await deferred.promise;
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>foo</div>');

    go();
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>foo</div>');
  });

  test('renders non-primitive low-priority content only once', async () => {
    const go = () =>
      render(
        html`<div>${until(deferred.promise, html`loading...`)}</div>`,
        container
      );

    go();
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div>loading...</div>'
    );
    deferred.resolve('foo');
    await deferred.promise;
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>foo</div>');

    go();
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>foo</div>');
  });

  test('renders changing defaultContent', async () => {
    const t = (d: any) => html`<div>${until(deferred.promise, d)}</div>`;
    render(t('A'), container);
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>A</div>');

    render(t('B'), container);
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>B</div>');

    deferred.resolve('C');
    await deferred.promise;
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>C</div>');
  });

  test('renders a Promise to an attribute', async () => {
    const promise = Promise.resolve('foo');
    render(html`<div test=${until(promise)}></div>`, container);
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');
    await promise;
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div test="foo"></div>'
    );
  });

  test('renders defaultContent to an attribute', async () => {
    const promise = Promise.resolve('foo');
    render(html`<div test=${until(promise, 'bar')}></div>`, container);
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div test="bar"></div>'
    );
    await promise;
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div test="foo"></div>'
    );
  });

  test('renders a Promise to an interpolated attribute', async () => {
    const promise = Promise.resolve('foo');
    render(html`<div test="value:${until(promise)}"></div>`, container);
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div test="value:"></div>'
    );
    await promise;
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div test="value:foo"></div>'
    );
  });

  test('renders a nothing fallback to an interpolated attribute', async () => {
    const promise = Promise.resolve('foo');
    render(
      html`<div test="value:${until(promise, nothing)}"></div>`,
      container
    );
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');
    await promise;
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div test="value:foo"></div>'
    );
  });

  test('renders defaultContent to an interpolated attribute', async () => {
    const promise = Promise.resolve('foo');
    render(html`<div test="value:${until(promise, 'bar')}"></div>`, container);
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div test="value:bar"></div>'
    );
    await promise;
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div test="value:foo"></div>'
    );
  });

  test('renders a Promise to a property', async () => {
    const promise = Promise.resolve('foo');
    render(html`<div .test=${until(promise)}></div>`, container);
    const div = container.querySelector('div');
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');
    assert.equal((div as any).test, undefined);
    await promise;
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');
    assert.equal((div as any).test, 'foo');
  });

  test('renders a Promise to a boolean attribute', async () => {
    const promise = Promise.resolve(true);
    render(html`<div ?test=${until(promise)}></div>`, container);
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');
    await promise;
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div test=""></div>'
    );
  });

  test('renders a Promise to an event binding', async () => {
    let called = false;
    const promise = Promise.resolve(() => {
      called = true;
    });
    render(html`<div @test=${until(promise)}></div>`, container);
    const div = container.querySelector('div')!;
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');
    div.dispatchEvent(new CustomEvent('test'));
    assert.isFalse(called);
    await promise;
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');
    div.dispatchEvent(new CustomEvent('test'));
    assert.isTrue(called);
  });

  test('renders new Promise over existing Promise', async () => {
    const t = (v: any) =>
      html`<div>${until(v, html`<span>loading...</span>`)}</div>`;
    render(t(deferred.promise), container);
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div><span>loading...</span></div>'
    );

    const deferred2 = new Deferred<string>();
    render(t(deferred2.promise), container);
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div><span>loading...</span></div>'
    );

    deferred2.resolve('bar');
    await deferred2.promise;
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>bar</div>');

    deferred.resolve('foo');
    await deferred.promise;
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>bar</div>');
  });

  test('renders racing Promises across renders correctly', async () => {
    const deferred1 = new Deferred<any>();
    const deferred2 = new Deferred<any>();

    const t = (promise: any) => html`<div>${until(promise)}</div>`;

    // First render, first Promise, no value
    render(t(deferred1.promise), container);
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');

    // Second render, second Promise, still no value
    render(t(deferred2.promise), container);
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');

    // Resolve the first Promise, should not update the container
    deferred1.resolve('foo');
    await deferred1.promise;
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');
    // Resolve the second Promise, should update the container
    deferred2.resolve('bar');
    await deferred2.promise;
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>bar</div>');
  });

  test('renders Promises resolving in high-to-low priority', async () => {
    const deferred1 = new Deferred<any>();
    const deferred2 = new Deferred<any>();

    const t = () =>
      html`<div>${until(deferred1.promise, deferred2.promise)}</div>`;

    // First render with neither Promise resolved
    render(t(), container);
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');

    // Resolve the primary Promise, updates the DOM
    deferred1.resolve('foo');
    await deferred1.promise;
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>foo</div>');

    // Resolve the secondary Promise, should not update the container
    deferred2.resolve('bar');
    await deferred2.promise;
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>foo</div>');
  });

  test('renders Promises resolving in low-to-high priority', async () => {
    const deferred1 = new Deferred<any>();
    const deferred2 = new Deferred<any>();

    const t = () =>
      html`<div>${until(deferred1.promise, deferred2.promise)}</div>`;

    // First render with neither Promise resolved
    render(t(), container);
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');

    // Resolve the secondary Promise, updates the DOM
    deferred2.resolve('bar');
    await deferred2.promise;
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>bar</div>');

    // Resolve the primary Promise, updates the DOM
    deferred1.resolve('foo');
    await deferred1.promise;
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>foo</div>');
  });

  test('renders Promises with changing priorities', async () => {
    const promise1 = Promise.resolve('foo');
    const promise2 = Promise.resolve('bar');

    const t = (p1: any, p2: any) => html`<div>${until(p1, p2)}</div>`;

    render(t(promise1, promise2), container);
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');
    // Await a microtask to let both Promise then callbacks go
    await 0;
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>foo</div>');

    render(t(promise2, promise1), container);
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>foo</div>');
    await 0;
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>bar</div>');
  });

  test('renders low-priority content when arguments change', async () => {
    const deferred1 = new Deferred<any>();
    const promise2 = Promise.resolve('bar');

    const t = (p1: any, p2: any) => html`<div>${until(p1, p2)}</div>`;

    // First render a high-priority value
    render(t('string', promise2), container);
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div>string</div>'
    );
    // Await a microtask to let both Promise then callbacks go
    await 0;
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div>string</div>'
    );

    // Then render new Promises with the low-priority Promise already resolved
    render(t(deferred1.promise, promise2), container);
    // Because they're Promises, nothing happens synchronously
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div>string</div>'
    );
    await 0;
    // Low-priority renders
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>bar</div>');
    deferred1.resolve('foo');
    await deferred1.promise;
    // High-priority renders
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>foo</div>');
  });

  test('renders Promises resolving after changing priority', async () => {
    const deferred1 = new Deferred<any>();
    const deferred2 = new Deferred<any>();

    const t = (p1: any, p2: any) => html`<div>${until(p1, p2)}</div>`;

    // First render with neither Promise resolved
    render(t(deferred1.promise, deferred2.promise), container);
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');

    // Change priorities
    render(t(deferred2.promise, deferred1.promise), container);
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');

    // Resolve the primary Promise, updates the DOM
    deferred1.resolve('foo');
    await deferred1.promise;
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>foo</div>');

    // Resolve the secondary Promise, also updates the DOM
    deferred2.resolve('bar');
    await deferred2.promise;
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>bar</div>');
  });

  test('renders a literal in a ChildPart', () => {
    render(html`${until('a')}`, container);
    assert.equal(stripExpressionMarkers(container.innerHTML), 'a');
  });

  test('renders a literal in an AttributePart', () => {
    render(html`<div data-attr="${until('a')}"></div>`, container);
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div data-attr="a"></div>'
    );
  });

  test('renders literals in an interpolated AttributePart', () => {
    render(
      html`<div data-attr="other ${until('a')} ${until('b')}"></div>`,
      container
    );
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div data-attr="other a b"></div>'
    );
  });

  test('renders a literal in a BooleanAttributePart', () => {
    render(html`<div ?data-attr="${until('a')}"></div>`, container);
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div data-attr=""></div>'
    );
  });

  test('renders a literal in an EventPart', () => {
    let callCount = 0;
    render(
      html`<div @some-event="${until(() => callCount++)}"></div>`,
      container
    );
    const div = container.querySelector('div') as HTMLDivElement;
    div.dispatchEvent(new Event('some-event'));
    assert.equal(callCount, 1);
  });

  test('renders a literal in a PropertyPart', () => {
    render(html`<div .someProp="${until('a')}"></div>`, container);
    assert.equal((container.querySelector('div')! as any).someProp, 'a');
  });

  test('renders a Promise in a ChildPart', async () => {
    render(html`${until(Promise.resolve('a'))}`, container);
    assert.equal(stripExpressionMarkers(container.innerHTML), '');

    await laterTask();
    assert.equal(stripExpressionMarkers(container.innerHTML), 'a');
  });

  test('renders a Promise in a AttributePart', async () => {
    render(
      html`<div data-attr="${until(Promise.resolve('a'))}"></div>`,
      container
    );
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');

    await laterTask();
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div data-attr="a"></div>'
    );
  });

  test('renders Promises in an interpolated AttributePart', async () => {
    render(
      html`<div data-attr="other ${until(Promise.resolve('a'))} ${until(
        Promise.resolve('b')
      )}"></div>`,
      container
    );
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div data-attr="other  "></div>'
    );

    await laterTask();
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div data-attr="other a b"></div>'
    );
  });

  test('renders a Promise in a BooleanAttributePart', async () => {
    render(
      html`<div ?data-attr="${until(Promise.resolve('a'))}"></div>`,
      container
    );
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');

    await laterTask();
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div data-attr=""></div>'
    );
  });

  test('renders a Promise in a PropertyPart', async () => {
    render(
      html`<div .someProp="${until(Promise.resolve('a'))}"></div>`,
      container
    );
    assert.equal((container.querySelector('div')! as any).someProp, undefined);

    await laterTask();
    assert.equal((container.querySelector('div')! as any).someProp, 'a');
  });

  test('renders a Promise in an EventPart', async () => {
    let callCount = 0;
    render(
      html`<div @some-event="${until(
        Promise.resolve(() => callCount++)
      )}"></div>`,
      container
    );
    const div = container.querySelector('div') as HTMLDivElement;
    div.dispatchEvent(new Event('some-event'));
    assert.equal(callCount, 0);

    await laterTask();
    div.dispatchEvent(new Event('some-event'));
    assert.equal(callCount, 1);
  });

  test('renders a promise-like in a ChildPart', async () => {
    const thenable = {
      then(resolve: (arg: unknown) => void) {
        resolve('a');
      },
    };

    render(html`${until(thenable)}`, container);
    assert.equal(stripExpressionMarkers(container.innerHTML), '');

    await laterTask();
    assert.equal(stripExpressionMarkers(container.innerHTML), 'a');
  });

  test('renders a promise-like in a AttributePart', async () => {
    const thenable = {
      then(resolve: (arg: unknown) => void) {
        resolve('a');
      },
    };

    render(html`<div data-attr="${until(thenable)}"></div>`, container);
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');

    await laterTask();
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div data-attr="a"></div>'
    );
  });

  test('renders promise-likes in an interpolated AttributePart', async () => {
    const thenableA = {
      then(resolve: (arg: unknown) => void) {
        resolve('a');
      },
    };

    const thenableB = {
      then(resolve: (arg: unknown) => void) {
        resolve('b');
      },
    };

    render(
      html`<div data-attr="other ${until(thenableA)} ${until(
        thenableB
      )}"></div>`,
      container
    );
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div data-attr="other  "></div>'
    );

    await laterTask();
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div data-attr="other a b"></div>'
    );
  });

  test('renders a promise-like in a BooleanAttributePart', async () => {
    const thenable = {
      then(resolve: (arg: unknown) => void) {
        resolve('a');
      },
    };

    render(html`<div ?data-attr="${until(thenable)}"></div>`, container);
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');

    await laterTask();
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div data-attr=""></div>'
    );
  });

  test('renders a promise-like in a PropertyPart', async () => {
    const thenable = {
      then(resolve: (arg: unknown) => void) {
        resolve('a');
      },
    };

    render(html`<div .someProp="${until(thenable)}"></div>`, container);
    assert.equal((container.querySelector('div')! as any).someProp, undefined);

    await laterTask();
    assert.equal((container.querySelector('div')! as any).someProp, 'a');
  });

  test('renders a promise-like in an EventPart', async () => {
    let callCount = 0;
    const thenable = {
      then(resolve: (arg: unknown) => void) {
        resolve(() => callCount++);
      },
    };

    render(html`<div @some-event="${until(thenable)}"></div>`, container);
    const div = container.querySelector('div') as HTMLDivElement;
    div.dispatchEvent(new Event('some-event'));
    assert.equal(callCount, 0);

    await laterTask();
    div.dispatchEvent(new Event('some-event'));
    assert.equal(callCount, 1);
  });

  test('renders later arguments until earlier promises resolve', async () => {
    let resolvePromise: (arg: any) => void;
    const promise = new Promise((resolve, _reject) => {
      resolvePromise = resolve;
    });

    render(html`${until(promise, 'default')}`, container);
    assert.equal(stripExpressionMarkers(container.innerHTML), 'default');

    resolvePromise!('resolved value');
    await laterTask();
    assert.equal(stripExpressionMarkers(container.innerHTML), 'resolved value');
  });

  test(
    'promises later in the arguments array than the currently used value ' +
      'do not overwrite the current value when they resolve',
    async () => {
      let resolvePromiseA: (arg: any) => void;
      const promiseA = new Promise((resolve, _reject) => {
        resolvePromiseA = resolve;
      });

      let resolvePromiseB: (arg: any) => void;
      const promiseB = new Promise((resolve, _reject) => {
        resolvePromiseB = resolve;
      });

      render(html`${until(promiseA, promiseB, 'default')}`, container);
      assert.equal(stripExpressionMarkers(container.innerHTML), 'default');

      resolvePromiseA!('A');
      await laterTask();
      assert.equal(stripExpressionMarkers(container.innerHTML), 'A');

      resolvePromiseB!('B');
      await laterTask();
      assert.equal(stripExpressionMarkers(container.innerHTML), 'A');
    }
  );

  test(
    'promises earlier in the arguments array than the currently used ' +
      'value overwrite the current value when they resolve',
    async () => {
      let resolvePromiseA: (arg: any) => void;
      const promiseA = new Promise((resolve, _reject) => {
        resolvePromiseA = resolve;
      });

      let resolvePromiseB: (arg: any) => void;
      const promiseB = new Promise((resolve, _reject) => {
        resolvePromiseB = resolve;
      });

      render(html`${until(promiseA, promiseB, 'default')}`, container);
      assert.equal(stripExpressionMarkers(container.innerHTML), 'default');

      resolvePromiseB!('B');
      await laterTask();
      assert.equal(stripExpressionMarkers(container.innerHTML), 'B');

      resolvePromiseA!('A');
      await laterTask();
      assert.equal(stripExpressionMarkers(container.innerHTML), 'A');
    }
  );

  test(
    'promises later in the arguments array than a non-promise are never ' +
      'rendered',
    async () => {
      let resolvePromise: (arg: any) => void;
      const promise = new Promise((resolve, _reject) => {
        resolvePromise = resolve;
      });

      render(html`${until('default', promise)}`, container);
      assert.equal(stripExpressionMarkers(container.innerHTML), 'default');

      resolvePromise!('resolved value');
      await laterTask();
      assert.equal(stripExpressionMarkers(container.innerHTML), 'default');
    }
  );

  suite('disconnection', () => {
    test('until does not render when promise resolves while disconnected', async () => {
      let resolvePromise: (arg: any) => void;
      const promise = new Promise((resolve, _reject) => {
        resolvePromise = resolve;
      });

      const part = render(html`<div>${until(promise)}</div>`, container);
      assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');

      part.setConnected(false);
      resolvePromise!('resolved');
      await laterTask();
      assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');

      part.setConnected(true);
      await laterTask();
      assert.equal(
        stripExpressionMarkers(container.innerHTML),
        '<div>resolved</div>'
      );
    });

    test('disconnection thrashing', async () => {
      let resolvePromise: (arg: any) => void;
      const promise = new Promise((resolve, _reject) => {
        resolvePromise = resolve;
      });

      const part = render(html`<div>${until(promise)}</div>`, container);
      assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');

      part.setConnected(false);
      resolvePromise!('resolved');
      await laterTask();
      part.setConnected(true);
      part.setConnected(false);

      await laterTask();
      assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');

      part.setConnected(true);
      await laterTask();
      assert.equal(
        stripExpressionMarkers(container.innerHTML),
        '<div>resolved</div>'
      );
    });

    test('until does not render when newly rendered while disconnected', async () => {
      let resolvePromise: (arg: any) => void;
      const promise = new Promise((resolve, _reject) => {
        resolvePromise = resolve;
      });

      const template = (v: unknown) => html`<div>${v}</div>`;

      const part = render(template(''), container);
      assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');

      part.setConnected(false);
      render(template(until(promise)), container);
      resolvePromise!('resolved');
      await laterTask();
      assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');

      part.setConnected(true);
      await laterTask();
      assert.equal(
        stripExpressionMarkers(container.innerHTML),
        '<div>resolved</div>'
      );
    });

    test('until does not render when resolved and changed while disconnected', async () => {
      let resolvePromise: (arg: any) => void;
      const promise = new Promise((resolve, _reject) => {
        resolvePromise = resolve;
      });

      const template = (v: unknown) => html`<div>${v}</div>`;

      const part = render(template('1'), container);
      assert.equal(stripExpressionMarkers(container.innerHTML), '<div>1</div>');

      part.setConnected(false);
      render(template(until(promise)), container);
      await laterTask();

      render(template('2'), container);
      assert.equal(stripExpressionMarkers(container.innerHTML), '<div>2</div>');

      resolvePromise!('resolved');
      await laterTask();
      assert.equal(stripExpressionMarkers(container.innerHTML), '<div>2</div>');

      part.setConnected(true);
      await laterTask();
      assert.equal(stripExpressionMarkers(container.innerHTML), '<div>2</div>');
    });

    test('the same promise can be rendered into two until instances', async () => {
      let resolvePromise: (arg: any) => void;
      const promise = new Promise((resolve, _reject) => {
        resolvePromise = resolve;
      });

      render(
        html`<div>${until(promise, 'unresolved1')}</div><span>${until(
          promise,
          'unresolved2'
        )}</span>`,
        container
      );
      assert.equal(
        stripExpressionMarkers(container.innerHTML),
        '<div>unresolved1</div><span>unresolved2</span>'
      );

      resolvePromise!('resolved');
      await promise;

      assert.equal(
        stripExpressionMarkers(container.innerHTML),
        '<div>resolved</div><span>resolved</span>'
      );
    });
  });

  memorySuite('memory leak tests', () => {
    test('tree with until cleared while promise is pending', async () => {
      const template = (v: unknown) => html`<div>${v}</div>`;
      // Make a big array set on an expando to exaggerate any leaked DOM
      const big = () => new Array(10000).fill(0);
      // Hold onto the resolvers to prevent the promises from being gc'ed
      const resolvers: Array<() => void> = [];
      window.gc();
      const heap = performance.memory.usedJSHeapSize;
      for (let i = 0; i < 1000; i++) {
        // Promise passed to until that will never resolve
        const promise = new Promise<void>((r) => resolvers.push(r));
        // Render the until into a `<span>` with a 10kb expando, to exaggerate
        // when DOM is not being gc'ed
        render(
          template(html`<span .p=${big()}>${until(promise)}</span>`),
          container
        );
        // Clear the `<span>` + directive
        render(template(nothing), container);
        // Periodically force a GC to prevent the heap size from expanding
        // too much.
        // If we're leaking memory this is a noop. But if we aren't, this makes
        // it easier for the browser's GC to keep the heap size similar to the
        // actual amount of memory we're using.
        if (i % 30 === 0) {
          window.gc();
        }
      }
      window.gc();
      assert.isAtMost(
        performance.memory.usedJSHeapSize / heap - 1,
        // Allow a 20% margin of heap growth; due to the 10kb expando, an actual
        // DOM leak is orders of magnitude larger.
        0.2,
        'memory leak detected'
      );
    });
  });
});
