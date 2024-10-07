/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ReactiveElement} from '../../reactive-element.js';
import {listen} from '../../decorators/listen.js';
import {generateElementName} from '../test-helpers.js';
import {assert} from '@esm-bundle/chai';

suite('@listen', () => {
  let container: HTMLElement;

  setup(() => {
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
  });

  teardown(() => {
    if (container !== undefined) {
      container.parentElement!.removeChild(container);
      (container as any) = undefined;
    }
  });

  test('can listen on host and root', async () => {
    class E extends ReactiveElement {
      hostListenInfo = {};
      rootListenInfo = {};
      @listen({type: 'foo'})
      _hostHandler(e: Event) {
        this.hostListenInfo = {
          type: e.type,
          name: (e.target as Element).localName,
        };
      }

      @listen({type: 'foo', target: 'root'})
      _rootHandler(e: Event) {
        this.rootListenInfo = {
          type: e.type,
          name: (e.target as Element).localName,
        };
      }
    }
    const name = generateElementName();
    customElements.define(name, E);
    const el = new E();
    container.appendChild(el);
    await el.updateComplete;
    assert.deepEqual(el.hostListenInfo, {});
    assert.deepEqual(el.rootListenInfo, {});
    el.dispatchEvent(new Event('foo'));
    assert.deepEqual(el.hostListenInfo, {type: 'foo', name});
    assert.deepEqual(el.rootListenInfo, {});
    el.hostListenInfo = el.rootListenInfo = {};
    el.shadowRoot!.dispatchEvent(new Event('foo'));
    assert.deepEqual(el.rootListenInfo, {type: 'foo', name: undefined});
    assert.deepEqual(el.hostListenInfo, {});
    el.hostListenInfo = el.rootListenInfo = {};
    el.shadowRoot!.dispatchEvent(new Event('foo', {composed: true}));
    assert.deepEqual(el.rootListenInfo, {type: 'foo', name: undefined});
    assert.deepEqual(el.hostListenInfo, {type: 'foo', name});
    el.remove();
    el.hostListenInfo = el.rootListenInfo = {};
    el.shadowRoot!.dispatchEvent(new Event('foo', {composed: true}));
    assert.deepEqual(el.rootListenInfo, {type: 'foo', name: undefined});
    assert.deepEqual(el.hostListenInfo, {type: 'foo', name});
  });

  test('can listen with event options', async () => {
    class E extends ReactiveElement {
      listenInfo: string[] = [];
      @listen({type: 'foo', options: {capture: true}})
      _hostHandler() {
        this.listenInfo.push('@listen');
      }

      constructor() {
        super();
        this.addEventListener('foo', () => {
          this.listenInfo.push('addEventListener');
        });
      }
    }
    const name = generateElementName();
    customElements.define(name, E);
    const el = new E();
    container.appendChild(el);
    await el.updateComplete;
    assert.deepEqual(el.listenInfo, []);
    el.dispatchEvent(new Event('foo'));
    assert.deepEqual(el.listenInfo, ['@listen', 'addEventListener']);
  });

  test('can listen on target', async () => {
    class E extends ReactiveElement {
      targetListenInfo = {};
      @listen({type: 'foo', target: document})
      _targetHandler(e: Event) {
        this.targetListenInfo = {
          type: e.type,
          target: e.target,
        };
      }
    }
    const name = generateElementName();
    customElements.define(name, E);
    const el = new E();
    container.appendChild(el);
    await el.updateComplete;
    assert.deepEqual(el.targetListenInfo, {});
    document.dispatchEvent(new Event('foo'));
    assert.deepEqual(el.targetListenInfo, {type: 'foo', target: document});
    el.targetListenInfo = {};
    el.remove();
    document.dispatchEvent(new Event('foo'));
    assert.deepEqual(el.targetListenInfo, {});
    container.appendChild(el);
    document.dispatchEvent(new Event('foo'));
    assert.deepEqual(el.targetListenInfo, {type: 'foo', target: document});
    // add/remove one more time
    el.targetListenInfo = {};
    el.remove();
    document.dispatchEvent(new Event('foo'));
    assert.deepEqual(el.targetListenInfo, {});
    container.appendChild(el);
    document.dispatchEvent(new Event('foo'));
    assert.deepEqual(el.targetListenInfo, {type: 'foo', target: document});
  });

  test('can install multiple listener types', async () => {
    class E extends ReactiveElement {
      listenInfo: {}[] = [];
      @listen({type: 'click'})
      @listen({type: 'bar', target: 'root'})
      @listen({type: 'click', target: document})
      _handler(e: Event) {
        this.listenInfo.push({
          type: e.type,
          currentTarget: e.currentTarget,
        });
      }
    }
    const name = generateElementName();
    customElements.define(name, E);
    const el = new E();
    container.appendChild(el);
    await el.updateComplete;
    assert.deepEqual(el.listenInfo, []);
    el.renderRoot.dispatchEvent(new Event('bar'));
    assert.deepEqual(el.listenInfo, [
      {type: 'bar', currentTarget: el.renderRoot},
    ]);
    el.listenInfo = [];
    el.renderRoot.dispatchEvent(
      new Event('click', {composed: true, bubbles: true})
    );
    assert.deepEqual(el.listenInfo, [
      {type: 'click', currentTarget: el},
      {type: 'click', currentTarget: document},
    ]);
    el.listenInfo = [];
    document.dispatchEvent(new Event('click', {composed: true, bubbles: true}));
    assert.deepEqual(el.listenInfo, [{type: 'click', currentTarget: document}]);
    el.remove();
    el.listenInfo = [];
    document.dispatchEvent(new Event('click', {composed: true, bubbles: true}));
    assert.deepEqual(el.listenInfo, []);
    el.dispatchEvent(new Event('click', {composed: true, bubbles: true}));
    assert.deepEqual(el.listenInfo, [{type: 'click', currentTarget: el}]);
  });
});
