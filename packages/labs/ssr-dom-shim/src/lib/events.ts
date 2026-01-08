/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/* Adapted from Node.js https://github.com/nodejs/node/blob/main/lib/internal/event_target.js */

type EventInterface = Event;

// Event phases
const NONE = 0;
const CAPTURING_PHASE = 1;
const AT_TARGET = 2;
const BUBBLING_PHASE = 3;

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
  #target: globalThis.EventTarget | null;
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

  get target(): globalThis.EventTarget | null {
    return this.#target;
  }

  get currentTarget(): globalThis.EventTarget | null {
    return this.#target;
  }

  get srcElement(): globalThis.EventTarget | null {
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

  composedPath(): globalThis.EventTarget[] {
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
