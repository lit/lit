/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {eventOptions} from '../../decorators/event-options.js';
import {
  canTestReactiveElement,
  generateElementName,
  RenderingElement,
  html,
} from '../test-helpers.js';
import {assert} from '@esm-bundle/chai';

const wrap =
  window.ShadyDOM?.inUse && window.ShadyDOM?.noPatch === true
    ? window.ShadyDOM!.wrap
    : (node: Node) => node;

let hasOptions;
const supportsOptions = (function () {
  if (hasOptions !== undefined) {
    return hasOptions;
  }
  const fn = () => {};
  const event = 'foo';
  hasOptions = false;
  const options = {
    get capture() {
      hasOptions = true;
      return true;
    },
  };
  document.body.addEventListener(event, fn, options);
  document.body.removeEventListener(event, fn, options);
  return hasOptions;
})();

let hasPassive;
const supportsPassive = (function () {
  if (hasPassive !== undefined) {
    return hasPassive;
  }
  // Use an iframe since ShadyDOM will pass this test but doesn't actually
  // enforce passive behavior.
  const f = document.createElement('iframe');
  document.body.appendChild(f);
  const fn = () => {};
  const event = 'foo';
  hasPassive = false;
  const options = {
    get passive() {
      hasPassive = true;
      return true;
    },
  };
  f.contentDocument!.addEventListener(event, fn, options);
  f.contentDocument!.removeEventListener(
    event,
    fn,
    options as AddEventListenerOptions
  );
  document.body.removeChild(f);
  return hasPassive;
})();

let hasOnce;
const supportsOnce = (function () {
  if (hasOnce !== undefined) {
    return hasOnce;
  }
  // Use an iframe since ShadyDOM will pass this test but doesn't actually
  // enforce passive behavior.
  const f = document.createElement('iframe');
  document.body.appendChild(f);
  const fn = () => {};
  const event = 'foo';
  hasOnce = false;
  const options = {
    get once() {
      hasOnce = true;
      return true;
    },
  };
  f.contentDocument!.addEventListener(event, fn, options);
  f.contentDocument!.removeEventListener(
    event,
    fn,
    options as AddEventListenerOptions
  );
  document.body.removeChild(f);
  return hasOnce;
})();

(canTestReactiveElement ? suite : suite.skip)('@eventOptions', () => {
  let container: HTMLElement;

  class EventOptionsBase extends RenderingElement {
    button!: HTMLButtonElement;
    div!: HTMLDivElement;
    dispatcher!: HTMLSpanElement;

    currentTargets: Array<EventTarget | null> = [];

    onClick(e: Event) {
      this.currentTargets.push(e.currentTarget);
    }

    render() {
      return html`<div>
        <button><span></span></button>
      </div>`;
    }

    addListener(target: EventTarget) {
      wrap(target as Node).addEventListener(
        'click',
        (e: Event) => this.onClick(e),
        this.onClick as unknown as AddEventListenerOptions
      );
    }

    firstUpdated() {
      this.button = this.renderRoot.querySelector(
        'button'
      )! as HTMLButtonElement;
      this.div = this.renderRoot.querySelector('div')! as HTMLDivElement;
      this.dispatcher = this.renderRoot.querySelector(
        'span'
      )! as HTMLSpanElement;
      this.addListener(this.button);
      this.addListener(this.div);
      this.addListener(this);
    }
  }

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

  test('allows capturing listeners', async function () {
    if (!supportsOptions) {
      this.skip();
    }

    class C extends EventOptionsBase {
      @eventOptions({capture: true})
      onClick(e: Event) {
        super.onClick(e);
      }
    }
    customElements.define(generateElementName(), C);

    const c = new C();
    container.appendChild(c);
    await c.updateComplete;
    wrap(c.dispatcher).dispatchEvent(
      new Event('click', {bubbles: true, composed: true})
    );
    assert.deepEqual(c.currentTargets, [c, c.div, c.button]);
  });

  test('allows bubbling listeners', async function () {
    if (!supportsOptions) {
      this.skip();
    }
    class C extends EventOptionsBase {
      @eventOptions({capture: false})
      onClick(e: Event) {
        super.onClick(e);
      }
    }
    customElements.define(generateElementName(), C);

    const c = new C();
    container.appendChild(c);
    await c.updateComplete;
    wrap(c.dispatcher).dispatchEvent(
      new Event('click', {bubbles: true, composed: true})
    );
    assert.deepEqual(c.currentTargets, [c.button, c.div, c]);
  });

  test('allows once listeners', async function () {
    if (!supportsOnce) {
      this.skip();
    }

    class C extends EventOptionsBase {
      clicked = 0;

      @eventOptions({once: true})
      onClick() {
        this.clicked++;
      }
    }
    customElements.define(generateElementName(), C);

    const c = new C();
    container.appendChild(c);
    await c.updateComplete;
    c.click();
    c.click();
    assert.equal(c.clicked, 1);
  });

  test('allows passive listeners', async function () {
    if (!supportsPassive) {
      this.skip();
    }

    class C extends EventOptionsBase {
      defaultPrevented?: boolean;

      @eventOptions({passive: true})
      onClick(e: Event) {
        try {
          e.preventDefault();
        } catch (error) {
          // no need to do anything
        }
        this.defaultPrevented = e.defaultPrevented;
      }
    }
    customElements.define(generateElementName(), C);

    const c = new C();
    container.appendChild(c);
    await c.updateComplete;
    c.click();
    assert.isFalse(c.defaultPrevented);
  });
});
