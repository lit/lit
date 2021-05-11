/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/*
 * IMPORTANT: For compatibility with tsickle and the Closure JS compiler, all
 * property decorators (but not class decorators) in this file that have
 * an @ExportDecoratedItems annotation must be defined as a regular function,
 * not an arrow function.
 */

import {ReactiveElement} from '../reactive-element.js';
import {decorateProperty} from './base.js';

interface ListenInfo {
  type: string;
  prop: PropertyKey;
  options?: EventListenerOptions;
  target: '' | 'root' | EventTarget;
}

type Listeners = ListenInfo[];

const hostListeners: WeakMap<typeof ReactiveElement, Listeners> = new WeakMap();
const rootListeners: WeakMap<typeof ReactiveElement, Listeners> = new WeakMap();
const targetedListeners: WeakMap<
  typeof ReactiveElement,
  Listeners
> = new WeakMap();

// This is done so we can call the listener in the right context.
// TODO(sorvell): Alternatively, can require users to bind the function, but this
// seemslike a foot gun.
const listenerMap: WeakMap<
  ReactiveElement,
  Map<ListenInfo, EventListener>
> = new WeakMap();

const getListener = (
  el: ReactiveElement,
  listener: EventListener,
  info: ListenInfo
) => {
  let listeners = listenerMap.get(el);
  if (listeners === undefined) {
    listenerMap.set(el, (listeners = new Map()));
  }
  let listenFn = listeners.get(info);
  if (listenFn === undefined) {
    listeners.set(info, (listenFn = listener.bind(el)));
  }
  return listenFn;
};

const addRemoveListeners = (
  el: ReactiveElement,
  listeners: Listeners,
  remove = false
) => {
  listeners.forEach((info: ListenInfo) => {
    const {type, prop, options, target} = info;
    const eventTarget =
      target === 'root'
        ? el.renderRoot
        : target instanceof EventTarget
        ? target
        : el;
    const listener = (((el as unknown) as {[prop: string]: Element | null})[
      prop as string
    ] as unknown) as EventListener;
    const listenFn = getListener(el, listener, info);
    if (remove) {
      eventTarget.removeEventListener(type, listenFn, options);
    } else {
      eventTarget.addEventListener(type, listenFn, options);
    }
  });
};

const hasRootListeners: Set<ReactiveElement> = new Set();

/**
 * Adds an event listener.
 *
 * @param options {object} An object specifying event listener options. This
 * object must include the `type` of the event for which to listen and
 * optionally may include an `options` property to specify the
 * `EventListenerOptions` and a `target` property. When `target` is not provided
 * the event listener is installed on the element itself. If set to `root`,
 * the listener is installed on the element `renderRoot`. Otherwise
 * `target` is assumed to be an `EventTarget` and the listener is installed
 * directly on it. When the `target` is an `EventTarget`, the listener is
 * dynamically added and removed when the element is connected/disconnected
 * from the DOM.
 *
 * @example
 * ```ts
 * class MyElement {
 *   @listen('click')
 *   private _clickHandler(e: Event) => {
 *     this.clickedOn = e.target.localName;
 *   }
 *   @listen('keydown', window, {capture: true}))
 *   private _keyDown(e: Event) => {
 *     this.key = e.target.keyCode;
 *   }
 * }
 * ```
 * @category Decorator
 */
export function listen({
  type,
  options,
  target,
}: {
  type: string;
  options?: EventListenerOptions;
  target?: '' | 'root' | EventTarget;
}) {
  return decorateProperty({
    finisher: (ctor: typeof ReactiveElement, prop: PropertyKey) => {
      let host = hostListeners.get(ctor);
      let root = rootListeners.get(ctor);
      let targeted = targetedListeners.get(ctor);
      // Setup listener tracking for this class
      if (host === undefined) {
        hostListeners.set(ctor, (host = []));
        rootListeners.set(ctor, (root = []));
        targetedListeners.set(ctor, (targeted = []));
        ctor.addInitializer((el: ReactiveElement) => {
          // Add host listeners early
          addRemoveListeners(el, host!);
          el.addController({
            hostConnected() {
              // Add renderRoot listeners once, when renderRoot is available.
              if (!hasRootListeners.has(el)) {
                hasRootListeners.add(el);
                addRemoveListeners(el, root!);
              }
              // Add targeted listeners on every connection
              addRemoveListeners(el, targeted!);
            },
            hostDisconnected() {
              addRemoveListeners(el, targeted!, true);
            },
          });
        });
      }
      const list =
        target === 'root'
          ? root!
          : target instanceof EventTarget
          ? targeted!
          : host!;
      list.push({
        type,
        prop,
        options,
        target: target ?? '',
      });
    },
  });
}
