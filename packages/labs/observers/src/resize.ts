/**
 * @license
 * Copyright (c) 2021 The Polymer Project Authors. All rights reserved.
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

import {ReactiveControllerHost, ElementPart, noChange} from 'lit';
import {DirectiveParameters} from 'lit/directive.js';
import {
  directive,
  AsyncDirective,
} from 'lit/async-directive.js';

const defaultKey = {};

/**
 * Observes the size of one or more elements, triggering an update of the host
 * when any observed element's size changes.
 *
 * ## Usage
 *
 * Create a ResizeController with the constructor and store it with the host:
 *
 * ```
 *   class MyElement extends LitElement {
 *     _resize = new ResizeController(this);
 *   }
 * ```
 *
 * To observe an element's size, add an element expression in the template with
 * this controllers `observe()` method:
 *
 * ```
 * render() {
 *   return html`<div ${this._resize.observe()}`></div>`;
 * }
 * ```
 *
 * Size information is stored in the controller's `borderBoxSize`,
 * `contentBoxSize`, and `contentRect` properties, similar to
 * ResizeObserverEntry:
 *
 * ```
 * render() {
 *   return html`
 *     <div ${this._resize.observe()}`>
 *       ${this._resize.contextRect?.width}
 *     </div>
 *   `;
 * }
 * ```
 *
 * @example
 *
 * ```ts
 * @customElement('resize-controller-demo')
 * class ResizeControllerDemoElement extends LitElement {
 *   _resize = new ResizeController(this);
 *
 *   render() {
 *     return html`
 *       <textarea ${this._resize.observe()}>Resize Me</textarea>
 *       <pre>
 *         Width: ${this._resize.get().contentRect?.width}
 *         Height: ${this._resize.get().contentRect?.height}
 *       </pre>
 *     `;
 *   }
 * }
 * ```
 */
export class ResizeController {
  private _host: ReactiveControllerHost & Element;
  // private _entry?: ResizeObserverEntry;
  private _entries = new Map<unknown, ResizeObserverEntry>();

  // get borderBoxSize() {
  //   return this._entry?.borderBoxSize;
  // }

  // get contentBoxSize() {
  //   return this._entry?.contentBoxSize;
  // }

  // get contentRect() {
  //   return this._entry?.contentRect;
  // }

  constructor(host: ReactiveControllerHost & Element) {
    this._host = host;
  }

  /**
   * Returns the last ResizeObserverEntry received by the controller.
   * 
   * @param key Optional observer key. This should match a key provided
   *   to observe()
   */
  get(key?: unknown) {
    return this._entries.get(key ?? defaultKey);
  }

  /**
   * A element expression directive that listens to size changes on the
   * element it's attached to. If only one element is being observed, then
   * a key is not necessary. Otherwise use a unique key per target element to
   * retrieve ResizeObserverEntrys with `.get(key)`.
   */
  observe(key?: unknown) {
    return resizeDirective(this, key);
  }

  protected onResize(entry: ResizeObserverEntry, key?: unknown) {
    this._entries.set(key ?? defaultKey, entry);
    this._host.requestUpdate();
  }
}

interface ResizeControllerInternal {
  onResize(entry: ResizeObserverEntry, key?: unknown): void;
}

class ResizeDirective extends AsyncDirective {
  private _observer = new ResizeObserver((entries: ResizeObserverEntry[]) => {
    for (const entry of entries) {
      if (entry.target === this._target) {
        ((this._controller as unknown) as ResizeControllerInternal)?.onResize(
          entry, this._key
        );
      }
    }
  });

  private _controller?: ResizeController;
  private _target?: Element;
  private _observing = false;
  private _key?: unknown;

  render(_controller: ResizeController, key?: unknown) {
    this._key = key;
    return noChange;
  }

  update(part: ElementPart, [controller]: DirectiveParameters<this>) {
    this._target ??= part.element;
    this._controller ??= controller;
    if (!this._observing) {
      this._observer.observe(this._target);
      this._observing = true;
    }
    return noChange;
  }

  disconnected() {
    if (this._observing) {
      this._observer.unobserve(this._target!);
      this._observing = false;
    }
  }

  reconnected() {
    if (!this._observing) {
      this._observer.unobserve(this._target!);
      this._observing = true;
    }
  }
}
const resizeDirective = directive(ResizeDirective);
