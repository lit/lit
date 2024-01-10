/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {html, LitElement, ReactiveElement, Part, nothing} from 'lit-element';
import {directive, AsyncDirective} from 'lit-html/async-directive.js';
import {
  canTestLitElement,
  generateElementName,
  nextFrame,
} from './test-helpers.js';
import {stripExpressionComments} from '@lit-labs/testing';
import {assert} from '@esm-bundle/chai';

import {createRef, ref} from 'lit-html/directives/ref.js';

(canTestLitElement ? suite : suite.skip)('LitElement', () => {
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

  test('renders initial content into shadowRoot', async () => {
    const rendered = `hello world`;
    const name = generateElementName();
    customElements.define(
      name,
      class extends LitElement {
        override render() {
          return html`${rendered}`;
        }
      }
    );
    const el = document.createElement(name);
    container.appendChild(el);
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        assert.ok(el.shadowRoot);
        assert.equal(
          stripExpressionComments(el.shadowRoot!.innerHTML),
          rendered
        );
        resolve();
      });
    });
  });

  test('can set render target to light dom', async () => {
    const rendered = `hello world`;
    const name = generateElementName();
    customElements.define(
      name,
      class extends LitElement {
        override render() {
          return html`${rendered}`;
        }

        override createRenderRoot() {
          return this;
        }
      }
    );
    const el = document.createElement(name);
    container.appendChild(el);
    await (el as LitElement).updateComplete;
    assert.notOk(el.shadowRoot);
    assert.equal(stripExpressionComments(el.innerHTML), rendered);
  });

  test('renders when created via constructor', async () => {
    const rendered = `hello world`;
    class E extends LitElement {
      override render() {
        return html`${rendered}`;
      }
    }
    customElements.define(generateElementName(), E);
    const el = new E();
    container.appendChild(el);
    await el.updateComplete;
    assert.ok(el.shadowRoot);
    assert.equal(stripExpressionComments(el.shadowRoot!.innerHTML), rendered);
  });

  test('updates/renders attributes, properties, and event listeners via `lit-html`', async () => {
    class E extends LitElement {
      _event?: Event;

      override render() {
        const attr = 'attr';
        const prop = 'prop';
        const event = function (this: E, e: Event) {
          this._event = e;
        };
        return html`<div attr="${attr}" .prop="${prop}" @zug="${event}"></div>`;
      }
    }
    customElements.define(generateElementName(), E);
    const el = new E();
    container.appendChild(el);
    await el.updateComplete;
    const d = el.shadowRoot!.querySelector('div')!;
    assert.equal(d.getAttribute('attr'), 'attr');
    assert.equal((d as any).prop, 'prop');
    const e = new Event('zug');
    d.dispatchEvent(e);
    assert.equal(el._event, e);
  });

  test('event listeners are invoked with the right `this` value', async () => {
    class E extends LitElement {
      event?: Event;

      override render() {
        return html`<div @test=${this.onTest}></div>`;
      }

      onTest(e: Event) {
        this.event = e;
      }
    }
    customElements.define(generateElementName(), E);
    const el = new E();
    container.appendChild(el);
    await el.updateComplete;
    const div = el.shadowRoot!.querySelector('div')!;
    const event = new Event('test');
    div.dispatchEvent(event);
    assert.equal(el.event, event);
  });

  test('can set properties and attributes on sub-element', async () => {
    class E extends LitElement {
      static override get properties() {
        return {foo: {}, attr: {}, bool: {type: Boolean}};
      }
      foo = 'hi';
      bool = false;

      override render() {
        return html`${this.foo}`;
      }
    }
    customElements.define('x-2448', E);

    class F extends LitElement {
      inner: E | null = null;

      static override get properties() {
        return {bar: {}, bool: {type: Boolean}};
      }
      bar = 'outer';
      bool = false;

      override render() {
        return html`<x-2448
          .foo="${this.bar}"
          attr="${this.bar}"
          .bool="${this.bool}"
        ></x-2448>`;
      }

      override firstUpdated() {
        this.inner = this.shadowRoot!.querySelector('x-2448');
      }

      override get updateComplete() {
        return super.updateComplete.then(() => this.inner!.updateComplete);
      }
    }
    customElements.define(generateElementName(), F);
    const el = new F();
    container.appendChild(el);
    await el.updateComplete;
    assert.equal(el.inner!.shadowRoot!.textContent, 'outer');
    assert.equal((el.inner! as any).attr, 'outer');
    assert.equal(el.inner!.getAttribute('attr'), 'outer');
    assert.equal(el.inner!.bool, false);
    el.bar = 'test';
    el.bool = true;
    await el.updateComplete;
    assert.equal(el.inner!.shadowRoot!.textContent, 'test');
    assert.equal((el.inner! as any).attr, 'test');
    assert.equal(el.inner!.getAttribute('attr'), 'test');
    assert.equal(el.inner!.bool, true);
  });

  test('adds a version number', () => {
    assert.equal(window.litElementVersions!.length, 1);
  });

  test('event fired during rendering element can trigger an update', async () => {
    class E extends LitElement {
      override connectedCallback() {
        super.connectedCallback();
        this.dispatchEvent(
          new CustomEvent('foo', {bubbles: true, detail: 'foo'})
        );
      }
    }
    customElements.define('x-child-61012', E);

    class F extends LitElement {
      static override get properties() {
        return {foo: {type: String}};
      }

      foo = '';

      override render() {
        return html`<x-child-61012 @foo=${this._handleFoo}></x-child-61012
          ><span>${this.foo}</span>`;
      }

      _handleFoo(e: CustomEvent) {
        this.foo = e.detail;
      }
    }

    customElements.define(generateElementName(), F);
    const el = new F();
    container.appendChild(el);
    // eslint-disable-next-line no-empty
    while (!(await el.updateComplete)) {}
    assert.equal(el.shadowRoot!.textContent, 'foo');
  });

  test('exceptions in `render` throw but do not prevent further updates', async () => {
    // console errors produced by wtr upset it, so no-op console.error
    const consoleError = console.error;
    console.error = () => {};
    let shouldThrow = false;
    class A extends LitElement {
      static override properties = {foo: {}};
      foo = 5;
      updatedFoo = 0;

      override render() {
        if (shouldThrow) {
          throw new Error('test error');
        }
        return html`${this.foo}`;
      }
    }
    customElements.define(generateElementName(), A);
    const a = new A();
    container.appendChild(a);
    await a.updateComplete;
    assert.equal(a.shadowRoot!.textContent, '5');
    shouldThrow = true;
    a.foo = 10;
    let threw = false;
    try {
      await a.updateComplete;
    } catch (e) {
      threw = true;
    }
    assert.isTrue(threw);
    assert.equal(a.foo, 10);
    assert.equal(a.shadowRoot!.textContent, '5');
    shouldThrow = false;
    a.foo = 20;
    // Make sure to wait beyond error timing or wtr is sad.
    await new Promise((r) => setTimeout(r));
    assert.equal(a.foo, 20);
    assert.equal(a.shadowRoot!.textContent, '20');
    console.error = consoleError;
  });

  test('if `render` is unimplemented, do not overwrite renderRoot', async () => {
    class A extends LitElement {
      addedDom: HTMLElement | null = null;
      override createRenderRoot() {
        return this;
      }
    }
    customElements.define(generateElementName(), A);
    const a = new A();
    const testDom = document.createElement('div');
    a.appendChild(testDom);
    container.appendChild(a);
    await a.updateComplete;
    assert.equal(
      testDom.parentNode,
      a,
      'testDom should be a child of the component'
    );
  });

  test('can use ReactiveElement', async () => {
    class A extends ReactiveElement {}
    customElements.define(generateElementName(), A);
    const a = new A();
    container.appendChild(a);
    await a.updateComplete;
    assert.ok(a.hasUpdated);
  });

  (window.ShadyDOM && window.ShadyDOM.inUse ? test.skip : test)(
    'can customize shadowRootOptions',
    async () => {
      class A extends LitElement {
        static override shadowRootOptions: ShadowRootInit = {mode: 'closed'};
      }
      customElements.define(generateElementName(), A);
      const a = new A();
      container.appendChild(a);
      await a.updateComplete;
      assert.equal(a.shadowRoot, undefined);
    }
  );

  suite('directives', () => {
    suite('disconnection handling', () => {
      let host: Host;
      const log: string[] = [];

      const d = directive(
        class extends AsyncDirective {
          id!: unknown;
          render(id: unknown) {
            log.push(`render-${id}-${this.isConnected}`);
            return (this.id = id);
          }
          override disconnected() {
            log.push(`disconnect-${this.id}`);
          }
          override reconnected() {
            log.push(`reconnect-${this.id}`);
          }
        }
      );

      class Child extends LitElement {
        static override properties = {
          attr: {type: String},
          prop: {type: String},
        };
        attr = 'default';
        prop = 'default';
        override render() {
          return html`<div attr=${d('child-attr')} .prop=${d('child-prop')}>
            ${d('child-node')}
          </div>`;
        }
        get child() {
          // Cast to child so we can access .prop off of the div
          return this.shadowRoot?.firstElementChild;
        }
      }
      customElements.define('disc-child', Child);

      class Host extends LitElement {
        override render() {
          return html`<disc-child attr=${d('host-attr')} .prop=${d('host-prop')}
            >${d('host-node')}</disc-child
          >`;
        }
        get child() {
          // Cast to child so we can access .prop off of the div
          return this.shadowRoot!.firstElementChild as Child;
        }
      }
      customElements.define('disc-host', Host);

      const assertRendering = (host: Host) => {
        const child = host.child;
        assert.equal(child.getAttribute('attr'), 'host-attr');
        assert.equal(child.prop, 'host-prop');
        assert.equal(child.textContent?.trim(), 'host-node');
        const grandChild = child.child as Child;
        if (grandChild) {
          assert.equal(grandChild.getAttribute('attr'), 'child-attr');
          assert.equal(grandChild.prop, 'child-prop');
          assert.equal(grandChild.textContent?.trim(), 'child-node');
        }
      };

      setup(() => {
        log.length = 0;
        host = new Host();
      });

      teardown(() => {
        if (host.isConnected) {
          container.removeChild(host);
        }
      });

      test('directives render on connection', async () => {
        container.appendChild(host);
        await nextFrame();
        assertRendering(host);
        assert.deepEqual(log, [
          'render-host-attr-true',
          'render-host-prop-true',
          'render-host-node-true',
          'render-child-attr-true',
          'render-child-prop-true',
          'render-child-node-true',
        ]);
      });

      test('directives disconnect on disconnection', async () => {
        container.appendChild(host);
        await nextFrame();
        assertRendering(host);
        log.length = 0;
        container.removeChild(host);
        assertRendering(host);
        // Note: directive disconnection/reconnection is synchronous to
        // connected/disconnectedCallback
        assert.deepEqual(log, [
          'disconnect-host-attr',
          'disconnect-host-prop',
          'disconnect-host-node',
          'disconnect-child-attr',
          'disconnect-child-prop',
          'disconnect-child-node',
        ]);
      });

      test('directives reconnect on reconnection', async () => {
        container.appendChild(host);
        await nextFrame();
        assertRendering(host);
        container.removeChild(host);
        log.length = 0;
        container.appendChild(host);
        assertRendering(host);
        assert.deepEqual(log, [
          'reconnect-host-attr',
          'reconnect-host-prop',
          'reconnect-host-node',
          'reconnect-child-attr',
          'reconnect-child-prop',
          'reconnect-child-node',
        ]);
      });

      test('directives reconnect on reconnection', async () => {
        container.appendChild(host);
        await nextFrame();
        assertRendering(host);
        container.removeChild(host);
        await nextFrame();
        log.length = 0;
        container.appendChild(host);
        await nextFrame();
        assertRendering(host);
        assert.deepEqual(log, [
          'reconnect-host-attr',
          'reconnect-host-prop',
          'reconnect-host-node',
          'reconnect-child-attr',
          'reconnect-child-prop',
          'reconnect-child-node',
        ]);
      });

      test('directives reconnect and render on reconnection with pending render', async () => {
        container.appendChild(host);
        await nextFrame();
        assertRendering(host);
        container.removeChild(host);
        log.length = 0;
        host.requestUpdate();
        host.child.requestUpdate();
        container.appendChild(host);
        assertRendering(host);
        assert.deepEqual(log, [
          'reconnect-host-attr',
          'reconnect-host-prop',
          'reconnect-host-node',
          'reconnect-child-attr',
          'reconnect-child-prop',
          'reconnect-child-node',
        ]);
        log.length = 0;
        await nextFrame();
        assertRendering(host);
        assert.deepEqual(log, [
          'render-host-attr-true',
          'render-host-prop-true',
          'render-host-node-true',
          'render-child-attr-true',
          'render-child-prop-true',
          'render-child-node-true',
        ]);
      });

      test('directives render with isConnected: false if first render is while element is disconnected', async () => {
        container.appendChild(host);
        container.remove();
        await nextFrame();
        assertRendering(host);
        // Host directives render in an initially disconnected state.
        // Note that child directives didn't render because by the time the
        // host render happened, the child was not connected and is still
        // pending
        assert.deepEqual(log, [
          'render-host-attr-false',
          'render-host-prop-false',
          'render-host-node-false',
        ]);
        log.length = 0;
        document.body.appendChild(container);
        assertRendering(host);
        // Directive reconnection happens synchronous to connectedCallback
        assert.deepEqual(log, [
          'reconnect-host-attr',
          'reconnect-host-prop',
          'reconnect-host-node',
        ]);
        log.length = 0;
        // The initial render of the child happens a microtask after the host
        // reconnects, at which point its directives run in the connected state
        await nextFrame();
        assert.deepEqual(log, [
          'render-child-attr-true',
          'render-child-prop-true',
          'render-child-node-true',
        ]);
      });
    });
  });

  test('bind refs between elements', async () => {
    class RefChild extends LitElement {
      static override properties = {
        bool: {},
        ref: {},
      };
      bool = false;
      // default ref, should be unused
      ref = createRef();
      cb = (_el: Element | undefined) => {};
      override render() {
        return html` <span>
          ${this.bool
            ? html`<div id="true" ${ref(this.ref)} ${ref(this.cb)}></div>`
            : html`<div id="false" ${ref(this.ref)} ${ref(this.cb)}></div>`}
        </span>`;
      }
      get trueDiv() {
        return this.shadowRoot!.querySelector('#true');
      }
      get falseDiv() {
        return this.shadowRoot!.querySelector('#false');
      }
    }
    customElements.define('ref-child', RefChild);

    class RefHost extends LitElement {
      static override properties = {
        bool: {type: Boolean},
      };
      bool = false;
      elRef = createRef();
      el: Element | undefined;
      count = 0;
      elCallback = (el: Element | undefined) => {
        this.count++;
        this.el = el;
      };
      override render() {
        return html`<ref-child
          .bool=${this.bool}
          .ref=${this.elRef}
          .cb=${this.elCallback}
        ></ref-child>`;
      }
      get child() {
        return this.shadowRoot!.querySelector('ref-child') as RefChild;
      }
    }
    customElements.define('x-host', RefHost);

    const host = container.appendChild(new RefHost());
    await host.updateComplete;
    await host.child.updateComplete;
    assert.equal(host.el, host.child.falseDiv);
    assert.equal(host.elRef.value, host.child.falseDiv);
    assert.equal(host.count, 1);

    host.requestUpdate();
    await host.updateComplete;
    assert.equal(host.el, host.child.falseDiv);
    assert.equal(host.elRef.value, host.child.falseDiv);
    assert.equal(host.count, 1);

    host.child.requestUpdate();
    await host.child.updateComplete;
    assert.equal(host.el, host.child.falseDiv);
    assert.equal(host.elRef.value, host.child.falseDiv);
    assert.equal(host.count, 1);

    host.bool = true;
    await host.updateComplete;
    await host.child.updateComplete;
    assert.equal(host.el, host.child.trueDiv);
    assert.equal(host.elRef.value, host.child.trueDiv);
    assert.equal(host.count, 3);
  });

  test('directive as controller can be added/removed via connect/disconnect', async () => {
    const log: string[] = [];
    const controllerDirective = directive(
      class extends AsyncDirective {
        part?: Part;
        host?: Host;

        render() {
          log.push(`render-${this.host!.x}`);
          return nothing;
        }
        ensureHost() {
          if (this.host === undefined) {
            this.host = this.part!.options!.host as Host;
            this.host.addController(this);
          }
        }
        hostUpdate() {
          log.push(`hostUpdate-${this.host?.x}`);
        }
        hostUpdated() {
          log.push(`hostUpdated-${this.host!.x}`);
        }
        override update(part: Part) {
          if (this.part === undefined) {
            this.part = part;
          }
          this.ensureHost();
          this.render();
        }
        override disconnected() {
          this.host?.removeController(this);
          this.host = undefined;
        }
        override reconnected() {
          this.ensureHost();
        }
      }
    );

    class Host extends LitElement {
      static override properties = {
        bool: {},
        x: {},
      };
      bool: boolean;
      x: number;

      constructor() {
        super();
        this.bool = true;
        this.x = 0;
      }
      override render() {
        return html` ${this.bool
          ? html`<div ${controllerDirective()}></div>`
          : nothing}`;
      }
    }
    customElements.define('controller-host', Host);

    const host = container.appendChild(new Host());
    await host.updateComplete;
    assert.deepEqual(log, [`render-${host.x}`, `hostUpdated-${host.x}`]);
    log.length = 0;
    host.x = 1;
    await host.updateComplete;
    assert.deepEqual(log, [
      `hostUpdate-${host.x}`,
      `render-${host.x}`,
      `hostUpdated-${host.x}`,
    ]);
    log.length = 0;
    // disconnects directive
    host.bool = false;
    await host.updateComplete;
    assert.deepEqual(log, [`hostUpdate-${host.x}`]);
    log.length = 0;
    // reconnects directive
    host.bool = true;
    await host.updateComplete;
    assert.deepEqual(log, [`render-${host.x}`, `hostUpdated-${host.x}`]);
    // disconnects directive
    log.length = 0;
    host.bool = false;
    await host.updateComplete;
    assert.deepEqual(log, [`hostUpdate-${host.x}`]);
    log.length = 0;
    // render while directive is disconnected
    host.x = 2;
    await host.updateComplete;
    assert.deepEqual(log, []);
    // reconnects directive
    host.bool = true;
    await host.updateComplete;
    assert.deepEqual(log, [`render-${host.x}`, `hostUpdated-${host.x}`]);
  });
});
