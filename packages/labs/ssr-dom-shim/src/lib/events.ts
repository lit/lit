/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * This is a basic implementation of an EventTarget, Event and CustomEvent.
 *
 * This is not fully spec compliant (e.g. validation),
 * but should work well enough for our use cases.
 *
 * @see https://dom.spec.whatwg.org/#eventtarget
 * @see https://dom.spec.whatwg.org/#event
 * @see https://dom.spec.whatwg.org/#customevent
 */

export interface EventTargetShimMeta {
  /**
   * The event target parent represents the previous event target for an event
   * in capture phase and the next event target for a bubbling event.
   * Note that this is not the element parent
   */
  __eventTargetParent: EventTarget | undefined;
  /**
   * The host event target/element of this event target, if this event target
   * is inside a Shadow DOM.
   */
  __host: EventTarget | undefined;
}

type EventTargetInterface = EventTarget;

const isCaptureEventListener = (
  options: undefined | AddEventListenerOptions | boolean
) => (typeof options === 'boolean' ? options : options?.capture ?? false);

// Event phases
const NONE = 0;
const CAPTURING_PHASE = 1;
const AT_TARGET = 2;
const BUBBLING_PHASE = 3;

// Shim the global EventTarget object
const EventTargetShim = class EventTarget
  implements EventTargetInterface, EventTargetShimMeta
{
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
    if (callback === undefined || callback === null) {
      return;
    }
    const eventListenersMap = isCaptureEventListener(options)
      ? this.__captureEventListeners
      : this.__eventListeners;
    let eventListeners = eventListenersMap.get(type);
    if (eventListeners === undefined) {
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
    if (callback === undefined || callback === null) {
      return;
    }
    const eventListenersMap = isCaptureEventListener(options)
      ? this.__captureEventListeners
      : this.__eventListeners;
    const eventListeners = eventListenersMap.get(type);
    if (eventListeners !== undefined) {
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
    let eventPhase = NONE;
    let target: EventTarget | null = null;
    let tmpTarget: EventTarget | null = null;
    let currentTarget: EventTarget | null = null;
    const originalStopPropagation = event.stopPropagation;
    const originalStopImmediatePropagation = event.stopImmediatePropagation;
    Object.defineProperties(event, {
      target: {
        get() {
          return target ?? tmpTarget;
        },
        ...enumerableProperty,
      },
      srcElement: {
        get() {
          return event.target;
        },
        ...enumerableProperty,
      },
      currentTarget: {
        get() {
          return currentTarget;
        },
        ...enumerableProperty,
      },
      eventPhase: {
        get() {
          return eventPhase;
        },
        ...enumerableProperty,
      },
      composedPath: {
        value: () => composedPath,
        ...enumerableProperty,
      },
      stopPropagation: {
        value: () => {
          stopPropagation = true;
          originalStopPropagation.call(event);
        },
        ...enumerableProperty,
      },
      stopImmediatePropagation: {
        value: () => {
          stopImmediatePropagation = true;
          originalStopImmediatePropagation.call(event);
        },
        ...enumerableProperty,
      },
    });

    // An event handler can either be a function, an object with a handleEvent
    // method or null. This function takes care to call the event handler
    // correctly.
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
    // When an event is finished being dispatched, which can be after the event
    // tree has been traversed or stopPropagation/stopImmediatePropagation has
    // been called. Once that is the case, the currentTarget and eventPhase
    // need to be reset and a value, representing whether the event has not
    // been prevented, needs to be returned.
    const finishDispatch = () => {
      currentTarget = null;
      eventPhase = NONE;
      return !event.defaultPrevented;
    };

    // An event starts with the capture order, where it starts from the top.
    // This is done even if bubbles is set to false, which is the default.
    const captureEventPath = composedPath.slice().reverse();
    // If the event target, which dispatches the event, is either in the light DOM
    // or the event is not composed, the target is always itself. If that is not
    // the case, the target needs to be retargeted: https://dom.spec.whatwg.org/#retarget
    target = !this.__host || !event.composed ? this : null;
    const retarget = (eventTargets: EventTarget[]) => {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      tmpTarget = this;
      while (tmpTarget.__host && eventTargets.includes(tmpTarget.__host)) {
        tmpTarget = tmpTarget.__host;
      }
    };
    for (const eventTarget of captureEventPath) {
      if (!target && (!tmpTarget || tmpTarget === eventTarget.__host)) {
        retarget(captureEventPath.slice(captureEventPath.indexOf(eventTarget)));
      }
      currentTarget = eventTarget;
      eventPhase = eventTarget === event.target ? AT_TARGET : CAPTURING_PHASE;
      const captureEventListeners = eventTarget.__captureEventListeners.get(
        event.type
      );
      if (captureEventListeners) {
        for (const [listener, options] of captureEventListeners) {
          invokeEventListener(listener, options, captureEventListeners);
          if (stopImmediatePropagation) {
            // Event.stopImmediatePropagation() stops any following invocation
            // of an event handler even on the same event target.
            return finishDispatch();
          }
        }
      }
      if (stopPropagation) {
        // Event.stopPropagation() stops any following invocation
        // of an event handler for any following event targets.
        return finishDispatch();
      }
    }

    const bubbleEventPath = event.bubbles ? composedPath : [this];
    tmpTarget = null;
    for (const eventTarget of bubbleEventPath) {
      if (
        !target &&
        (!tmpTarget || eventTarget === (tmpTarget as EventTarget).__host)
      ) {
        retarget(
          bubbleEventPath.slice(0, bubbleEventPath.indexOf(eventTarget) + 1)
        );
      }
      currentTarget = eventTarget;
      eventPhase = eventTarget === event.target ? AT_TARGET : BUBBLING_PHASE;
      const captureEventListeners = eventTarget.__eventListeners.get(
        event.type
      );
      if (captureEventListeners) {
        for (const [listener, options] of captureEventListeners) {
          invokeEventListener(listener, options, captureEventListeners);
          if (stopImmediatePropagation) {
            // Event.stopImmediatePropagation() stops any following invocation
            // of an event handler even on the same event target.
            return finishDispatch();
          }
        }
      }
      if (stopPropagation) {
        // Event.stopPropagation() stops any following invocation
        // of an event handler for any following event targets.
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

const enumerableProperty: Record<string, unknown> = {__proto__: null};
enumerableProperty.enumerable = true;
Object.freeze(enumerableProperty);

// TODO: Remove this when we remove support for vm modules (--experimental-vm-modules).
const EventShim = class Event implements EventInterface {
  #cancelable = false;
  #bubbles = false;
  #composed = false;
  #defaultPrevented = false;
  #timestamp = Date.now();
  #propagationStopped = false;
  #type: string;
  #target: EventTarget | null;
  #isBeingDispatched: boolean;
  readonly NONE = NONE;
  readonly CAPTURING_PHASE = CAPTURING_PHASE;
  readonly AT_TARGET = AT_TARGET;
  readonly BUBBLING_PHASE = BUBBLING_PHASE;
  static readonly NONE = NONE;
  static readonly CAPTURING_PHASE = CAPTURING_PHASE;
  static readonly AT_TARGET = AT_TARGET;
  static readonly BUBBLING_PHASE = BUBBLING_PHASE;

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

    this.#type = `${type}`;
    this.#target = null;
    this.#isBeingDispatched = false;
  }

  initEvent(_type: string, _bubbles?: boolean, _cancelable?: boolean): void {
    throw new Error('Method not implemented.');
  }

  stopImmediatePropagation() {
    this.stopPropagation();
  }

  preventDefault() {
    this.#defaultPrevented = true;
  }

  get target(): EventTarget | null {
    return this.#target;
  }

  get currentTarget(): EventTarget | null {
    return this.#target;
  }

  get srcElement(): EventTarget | null {
    return this.#target;
  }

  get type(): string {
    return this.#type;
  }

  get cancelable(): boolean {
    return this.#cancelable;
  }

  get defaultPrevented(): boolean {
    return this.#cancelable && this.#defaultPrevented;
  }

  get timeStamp(): number {
    return this.#timestamp;
  }

  composedPath(): EventTarget[] {
    return this.#isBeingDispatched ? [this.#target!] : [];
  }

  get returnValue(): boolean {
    return !this.#cancelable || !this.#defaultPrevented;
  }

  get bubbles(): boolean {
    return this.#bubbles;
  }

  get composed(): boolean {
    return this.#composed;
  }

  get eventPhase(): number {
    return this.#isBeingDispatched ? Event.AT_TARGET : Event.NONE;
  }

  get cancelBubble(): boolean {
    return this.#propagationStopped;
  }

  set cancelBubble(value) {
    if (value) {
      this.#propagationStopped = true;
    }
  }

  stopPropagation(): void {
    this.#propagationStopped = true;
  }

  get isTrusted(): boolean {
    return false;
  }
};

Object.defineProperties(EventShim.prototype, {
  initEvent: enumerableProperty,
  stopImmediatePropagation: enumerableProperty,
  preventDefault: enumerableProperty,
  target: enumerableProperty,
  currentTarget: enumerableProperty,
  srcElement: enumerableProperty,
  type: enumerableProperty,
  cancelable: enumerableProperty,
  defaultPrevented: enumerableProperty,
  timeStamp: enumerableProperty,
  composedPath: enumerableProperty,
  returnValue: enumerableProperty,
  bubbles: enumerableProperty,
  composed: enumerableProperty,
  eventPhase: enumerableProperty,
  cancelBubble: enumerableProperty,
  stopPropagation: enumerableProperty,
  isTrusted: enumerableProperty,
});

type CustomEventInterface = CustomEvent;

// TODO: Remove this when we remove support for vm modules (--experimental-vm-modules).
const CustomEventShim = class CustomEvent<T>
  extends EventShim
  implements CustomEventInterface
{
  #detail: T | null;

  constructor(type: string, options: CustomEventInit<T> = {}) {
    super(type, options);
    this.#detail = options?.detail ?? null;
  }

  initCustomEvent(
    _type: string,
    _bubbles?: boolean,
    _cancelable?: boolean,
    _detail?: T
  ): void {
    throw new Error('Method not implemented.');
  }

  get detail(): T {
    return this.#detail!;
  }
};

Object.defineProperties(CustomEventShim.prototype, {
  detail: enumerableProperty,
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
