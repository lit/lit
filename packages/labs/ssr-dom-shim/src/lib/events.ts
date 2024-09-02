/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * This implementation is not fully spec compliant (e.g. validation),
 * but should work well enough for our use cases.
 */

type EventTargetInterface = EventTarget;

const isCaptureEventListener = (
  options: undefined | AddEventListenerOptions | boolean
) => (typeof options === 'boolean' ? options : options?.capture ?? false);

// Shim the global EventTarget object
const EventTargetShim = class EventTarget implements EventTargetInterface {
  private __eventListeners = new Map<
    string,
    Map<EventListenerOrEventListenerObject, AddEventListenerOptions>
  >();
  private __captureEventListeners = new Map<
    string,
    Map<EventListenerOrEventListenerObject, AddEventListenerOptions>
  >();
  __eventTargetParent: EventTarget | undefined;
  __host: EventTarget | undefined;

  addEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: AddEventListenerOptions | boolean
  ): void {
    if (!callback) {
      return;
    }
    const eventListenersMap = isCaptureEventListener(options)
      ? this.__captureEventListeners
      : this.__eventListeners;
    let eventListeners = eventListenersMap.get(type);
    if (!eventListeners) {
      eventListeners = new Map();
      eventListenersMap.set(type, eventListeners);
    } else if (eventListeners.has(callback)) {
      return;
    }

    const normalizedOptions =
      typeof options === 'object' && options ? options : {};
    normalizedOptions.signal?.addEventListener('abort', () =>
      this.removeEventListener(type, callback, options)
    );
    eventListeners.set(callback, normalizedOptions ?? {});
  }
  removeEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: EventListenerOptions | boolean
  ): void {
    if (!callback) {
      return;
    }
    const eventListenersMap = isCaptureEventListener(options)
      ? this.__captureEventListeners
      : this.__eventListeners;
    const eventListeners = eventListenersMap.get(type);
    if (eventListeners) {
      eventListeners.delete(callback);
      if (!eventListeners.size) {
        eventListenersMap.delete(type);
      }
    }
  }
  dispatchEvent(event: Event): boolean {
    const composedPath: EventTarget[] = [this];
    let parent = this.__eventTargetParent;
    if (event.composed) {
      while (parent) {
        composedPath.push(parent);
        parent = parent.__eventTargetParent;
      }
    } else {
      // If the event is not composed and the event was dispatched inside
      // shadow DOM, we need to stop before the host of the shadow DOM.
      while (parent && parent !== this.__host) {
        composedPath.push(parent);
        parent = parent.__eventTargetParent;
      }
    }

    // We need to patch various properties that would either be empty or wrong
    // in this scenario.
    let stopPropagation = false;
    let stopImmediatePropagation = false;
    let eventPhase = 0;
    let currentTarget: EventTarget | null = null;
    const originalStopPropagation = event.stopPropagation;
    const originalStopImmediatePropagation = event.stopImmediatePropagation;
    Object.defineProperties(event, {
      target: {
        value: this,
        ...kEnumerableProperty,
      },
      srcElement: {
        value: this,
        ...kEnumerableProperty,
      },
      currentTarget: {
        get() {
          return currentTarget;
        },
        ...kEnumerableProperty,
      },
      eventPhase: {
        get() {
          return eventPhase;
        },
        ...kEnumerableProperty,
      },
      composedPath: {
        value: () => composedPath,
        ...kEnumerableProperty,
      },
      stopPropagation: {
        value: () => {
          stopPropagation = true;
          originalStopPropagation.call(this);
        },
        ...kEnumerableProperty,
      },
      stopImmediatePropagation: {
        value: () => {
          stopImmediatePropagation = true;
          originalStopImmediatePropagation.call(this);
        },
        ...kEnumerableProperty,
      },
    });

    const invokeEventListener = (
      listener: EventListenerOrEventListenerObject,
      options: AddEventListenerOptions,
      eventListenerMap: Map<
        EventListenerOrEventListenerObject,
        AddEventListenerOptions
      >
    ) => {
      if (typeof listener === 'function') {
        listener(event);
      } else if (typeof listener?.handleEvent === 'function') {
        listener.handleEvent(event);
      }
      if (options.once) {
        eventListenerMap.delete(listener);
      }
    };
    const finishDispatch = () => {
      currentTarget = null;
      eventPhase = 0;
      return !event.defaultPrevented;
    };

    // An event starts with the capture order, where it starts from the top.
    // This is done, even if bubbles is set to false (default).
    for (const eventTarget of composedPath.slice().reverse()) {
      currentTarget = eventTarget;
      eventPhase = eventTarget === this ? 2 : 1;
      const captureEventListeners = eventTarget.__captureEventListeners.get(
        event.type
      );
      if (captureEventListeners) {
        captureEventListeners.forEach((options, listener) => {
          invokeEventListener(listener, options, captureEventListeners);
          if (stopImmediatePropagation) {
            return finishDispatch();
          }
        });
      }
      if (stopPropagation) {
        return finishDispatch();
      }
    }

    const bubbleEventPath = event.bubbles ? composedPath : [this];
    for (const eventTarget of bubbleEventPath) {
      currentTarget = eventTarget;
      eventPhase = eventTarget === this ? 2 : 3;
      const captureEventListeners = eventTarget.__eventListeners.get(
        event.type
      );
      if (captureEventListeners) {
        captureEventListeners.forEach((options, listener) => {
          invokeEventListener(listener, options, captureEventListeners);
          if (stopImmediatePropagation) {
            return finishDispatch();
          }
        });
      }
      if (stopPropagation) {
        return finishDispatch();
      }
    }
    return finishDispatch();
  }
};

const EventTargetShimWithRealType =
  EventTargetShim as object as typeof EventTarget;
export {
  EventTargetShimWithRealType as EventTarget,
  EventTargetShimWithRealType as EventTargetShim,
};

/* Adapted from Node.js https://github.com/nodejs/node/blob/main/lib/internal/event_target.js */

type EventInterface = Event;

const kEnumerableProperty: Record<string, unknown> = {__proto__: null};
kEnumerableProperty.enumerable = true;
Object.freeze(kEnumerableProperty);

const kIsBeingDispatched = Symbol('kIsBeingDispatched');
const kStop = Symbol('kStop');
const kTarget = Symbol('kTarget');

const kType = Symbol('type');
const kDetail = Symbol('detail');

function isEvent(value: unknown) {
  return typeof (value as {[kType]: unknown})?.[kType] === 'string';
}

const EventShim = class Event implements EventInterface {
  #cancelable = false;
  #bubbles = false;
  #composed = false;
  #defaultPrevented = false;
  #timestamp = Date.now();
  #propagationStopped = false;
  [kType]: string;
  [kTarget]: EventTarget | null;
  [kIsBeingDispatched]: boolean;
  [kStop]?: boolean;
  readonly NONE = 0;
  readonly CAPTURING_PHASE = 1;
  readonly AT_TARGET = 2;
  readonly BUBBLING_PHASE = 3;
  static readonly NONE = 0;
  static readonly CAPTURING_PHASE = 1;
  static readonly AT_TARGET = 2;
  static readonly BUBBLING_PHASE = 3;

  /**
   * @param {string} type
   * @param {{
   *   bubbles?: boolean,
   *   cancelable?: boolean,
   *   composed?: boolean,
   * }} [options]
   */
  constructor(type: string, options: EventInit = {}) {
    if (arguments.length === 0)
      throw new Error(`The type argument must be specified`);
    if (typeof options !== 'object' || !options) {
      throw new Error(`The "options" argument must be an object`);
    }
    const {bubbles, cancelable, composed} = options;
    this.#cancelable = !!cancelable;
    this.#bubbles = !!bubbles;
    this.#composed = !!composed;

    this[kType] = `${type}`;
    this[kTarget] = null;
    this[kIsBeingDispatched] = false;
  }

  /**
   * @param {string} type
   * @param {boolean} [bubbles]
   * @param {boolean} [cancelable]
   */
  initEvent(type: string, bubbles = false, cancelable = false) {
    if (arguments.length === 0)
      throw new Error(`The type argument must be specified`);

    if (this[kIsBeingDispatched]) {
      return;
    }
    this[kType] = `${type}`;
    this.#bubbles = !!bubbles;
    this.#cancelable = !!cancelable;
  }

  stopImmediatePropagation() {
    if (!isEvent(this))
      throw new Error('Value of "this" must be of type Event');
    // Spec mention "stopImmediatePropagation should set both "stop propagation"
    // and "stop immediate propagation" flags"
    // cf: from https://dom.spec.whatwg.org/#dom-event-stopimmediatepropagation
    this.stopPropagation();
    this[kStop] = true;
  }

  preventDefault() {
    if (!isEvent(this))
      throw new Error('Value of "this" must be of type Event');
    this.#defaultPrevented = true;
  }

  /**
   * @type {EventTarget}
   */
  get target() {
    if (!isEvent(this))
      throw new Error('Value of "this" must be of type Event');
    return this[kTarget];
  }

  /**
   * @type {EventTarget}
   */
  get currentTarget() {
    if (!isEvent(this))
      throw new Error('Value of "this" must be of type Event');
    return this[kTarget];
  }

  /**
   * @type {EventTarget}
   */
  get srcElement() {
    if (!isEvent(this))
      throw new Error('Value of "this" must be of type Event');
    return this[kTarget];
  }

  /**
   * @type {string}
   */
  get type() {
    if (!isEvent(this))
      throw new Error('Value of "this" must be of type Event');
    return this[kType];
  }

  /**
   * @type {boolean}
   */
  get cancelable() {
    if (!isEvent(this))
      throw new Error('Value of "this" must be of type Event');
    return this.#cancelable;
  }

  /**
   * @type {boolean}
   */
  get defaultPrevented() {
    if (!isEvent(this))
      throw new Error('Value of "this" must be of type Event');
    return this.#cancelable && this.#defaultPrevented;
  }

  /**
   * @type {number}
   */
  get timeStamp() {
    if (!isEvent(this))
      throw new Error('Value of "this" must be of type Event');
    return this.#timestamp;
  }

  // The following are non-op and unused properties/methods from Web API Event.
  // These are not supported in Node.js and are provided purely for
  // API completeness.
  /**
   * @returns {EventTarget[]}
   */
  composedPath() {
    if (!isEvent(this))
      throw new Error('Value of "this" must be of type Event');
    return this[kIsBeingDispatched] ? [this[kTarget]!] : [];
  }

  /**
   * @type {boolean}
   */
  get returnValue() {
    if (!isEvent(this))
      throw new Error('Value of "this" must be of type Event');
    return !this.#cancelable || !this.#defaultPrevented;
  }

  /**
   * @type {boolean}
   */
  get bubbles() {
    if (!isEvent(this))
      throw new Error('Value of "this" must be of type Event');
    return this.#bubbles;
  }

  /**
   * @type {boolean}
   */
  get composed() {
    if (!isEvent(this))
      throw new Error('Value of "this" must be of type Event');
    return this.#composed;
  }

  /**
   * @type {number}
   */
  get eventPhase() {
    if (!isEvent(this))
      throw new Error('Value of "this" must be of type Event');
    return this[kIsBeingDispatched] ? Event.AT_TARGET : Event.NONE;
  }

  /**
   * @type {boolean}
   */
  get cancelBubble() {
    if (!isEvent(this))
      throw new Error('Value of "this" must be of type Event');
    return this.#propagationStopped;
  }

  /**
   * @type {boolean}
   */
  set cancelBubble(value) {
    if (!isEvent(this))
      throw new Error('Value of "this" must be of type Event');
    if (value) {
      this.#propagationStopped = true;
    }
  }

  stopPropagation() {
    if (!isEvent(this))
      throw new Error('Value of "this" must be of type Event');
    this.#propagationStopped = true;
  }

  get isTrusted() {
    return false;
  }
};

Object.defineProperties(EventShim.prototype, {
  initEvent: kEnumerableProperty,
  stopImmediatePropagation: kEnumerableProperty,
  preventDefault: kEnumerableProperty,
  target: kEnumerableProperty,
  currentTarget: kEnumerableProperty,
  srcElement: kEnumerableProperty,
  type: kEnumerableProperty,
  cancelable: kEnumerableProperty,
  defaultPrevented: kEnumerableProperty,
  timeStamp: kEnumerableProperty,
  composedPath: kEnumerableProperty,
  returnValue: kEnumerableProperty,
  bubbles: kEnumerableProperty,
  composed: kEnumerableProperty,
  eventPhase: kEnumerableProperty,
  cancelBubble: kEnumerableProperty,
  stopPropagation: kEnumerableProperty,
  isTrusted: kEnumerableProperty,
});

type CustomEventInterface = CustomEvent;

function isCustomEvent(value: unknown) {
  return (
    isEvent(value) && (value as {[kDetail]: unknown})?.[kDetail] !== undefined
  );
}

const CustomEventShim = class CustomEvent<T>
  extends EventShim
  implements CustomEventInterface
{
  [kDetail]: T | null;
  /**
   * @constructor
   * @param {string} type
   * @param {{
   *   bubbles?: boolean,
   *   cancelable?: boolean,
   *   composed?: boolean,
   *   detail?: any,
   * }} [options]
   */
  constructor(type: string, options: CustomEventInit<T> = {}) {
    if (arguments.length === 0)
      throw new Error(`The type argument must be specified`);
    super(type, options);
    this[kDetail] = options?.detail ?? null;
  }

  initCustomEvent(
    type: string,
    bubbles?: boolean,
    cancelable?: boolean,
    detail?: T
  ): void {
    this[kDetail] = detail ?? null;
    super.initEvent(type, bubbles, cancelable);
  }

  /**
   * @type {any}
   */
  get detail() {
    if (!isCustomEvent(this))
      throw new Error('Value of "this" must be of type CustomEvent');
    return this[kDetail];
  }
};

Object.defineProperties(CustomEventShim.prototype, {
  detail: kEnumerableProperty,
});

const EventShimWithRealType = EventShim as object as typeof Event;
const CustomEventShimWithRealType =
  CustomEventShim as object as typeof CustomEvent;
export {
  EventShimWithRealType as Event,
  EventShimWithRealType as EventShim,
  CustomEventShimWithRealType as CustomEvent,
  CustomEventShimWithRealType as CustomEventShim,
};
