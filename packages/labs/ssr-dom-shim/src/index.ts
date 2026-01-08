/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import {ElementInternalsShim} from './lib/element-internals.js';
import {EventShim, CustomEventShim} from './lib/events.js';

export {
  ariaMixinAttributes,
  ElementInternals,
  HYDRATE_INTERNALS_ATTR_PREFIX,
} from './lib/element-internals.js';
export {
  CSSRule,
  CSSRuleList,
  CSSStyleSheet,
  MediaList,
  StyleSheet,
} from './lib/css.js';
export {CustomEvent, Event} from './lib/events.js';

// In an empty Node.js vm, we need to patch the global context.
// TODO: Remove these globalThis assignments when we remove support
// for vm modules (--experimental-vm-modules).
globalThis.Event ??= EventShim;
globalThis.CustomEvent ??= CustomEventShim;

const constructionToken = Symbol();

/**
 * Internal type to be used for the event polyfill functionality.
 * @deprecated Use EventTargetShimMeta directly, if needed.
 */
export type HTMLElementWithEventMeta = HTMLElement & EventTargetShimMeta;

/**
 * Properties necessary for the EventTarget shim to work.
 */
export interface EventTargetShimMeta {
  /**
   * The event target parent represents the previous event target for an event
   * in capture phase and the next event target for a bubbling event.
   * Note that this is not the element parent
   */
  __eventTargetParent: globalThis.EventTarget | undefined;
  /**
   * The host event target/element of this event target, if this event target
   * is inside a Shadow DOM.
   */
  __host: globalThis.EventTarget | undefined;
}

const isCaptureEventListener = (
  options: undefined | AddEventListenerOptions | boolean
) => (typeof options === 'boolean' ? options : (options?.capture ?? false));

const enumerableProperty: Record<string, unknown> = {__proto__: null};
enumerableProperty.enumerable = true;
Object.freeze(enumerableProperty);

/**
 * This is a basic implementation of an EventTarget.
 *
 * This is not fully spec compliant (e.g. validation),
 * but should work well enough for our use cases.
 *
 * @see https://dom.spec.whatwg.org/#eventtarget
 *
 * Example Event Path
 * ------------------
 *
 * Note that this depends on the logic in `packages/labs/ssr/src/lib/render-value.ts`.
 * Any element that is not a custom element or a slot element is skipped in the chain.
 *
 * <main>
 *   <my-el1>
 *     #shadow-dom (open)
 *       <div>
 *         <slot></slot>
 *         <my-el2>
 *           #shadow-dom (closed)
 *             <slot></slot>
 *             <event-dispatcher3></event-dispatcher3>
 *           <slot name="nested"></slot>
 *         </my-el2>
 *       </div>
 *     <event-dispatcher1></event-dispatcher1>
 *     <event-dispatcher2 slot="nested"></event-dispatcher2>
 *   </my-el1>
 * </main>
 *
 * Given the previous structure, the event path of this shim would be as follows,
 * for the given dispatcher with an event that bubbles (document-fragment
 * represents a ShadowRoot/#shadow-dom instance):
 *
 * <event-dispatcher1>:
 * [event-dispatcher1, slot{my-el1}, document-fragment{my-el1}, my-el1, document]
 *
 * <event-dispatcher2>:
 * [
 *   event-dispatcher2,
 *   slot[name="nested"]{my-el1},
 *   slot{my-el2},
 *   document-fragment{my-el2},
 *   my-el2,
 *   document-fragment{my-el1},
 *   my-el1,
 *   document
 * ]
 *
 * <event-dispatcher3> (without composed):
 * [event-dispatcher3, document-fragment{my-el2}]
 *
 * <event-dispatcher3> (composed):
 * [
 *   event-dispatcher3,
 *   document-fragment{my-el2},
 *   my-el2,
 *   document-fragment{my-el1},
 *   my-el1,
 *   document
 * ]
 */
class EventTarget implements globalThis.EventTarget, EventTargetShimMeta {
  private __eventListeners = new Map<
    string,
    Map<EventListenerOrEventListenerObject, AddEventListenerOptions>
  >();
  private __captureEventListeners = new Map<
    string,
    Map<EventListenerOrEventListenerObject, AddEventListenerOptions>
  >();
  private __eventPathCache?: EventTarget[];
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
    let composedPath = this.__resolveFullEventPath();
    if (!event.composed && this.__host) {
      // If the event is not composed and the event was dispatched inside
      // shadow DOM, we need to stop the event chain before the host of the
      // shadow DOM.
      composedPath = composedPath.slice(0, composedPath.indexOf(this.__host));
    }

    // We need to patch various properties that would either be empty or wrong
    // in this scenario.
    let stopPropagation = false;
    let stopImmediatePropagation = false;
    let eventPhase: number = EventShim.NONE;
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
      eventPhase = EventShim.NONE;
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
      eventPhase =
        eventTarget === event.target
          ? EventShim.AT_TARGET
          : EventShim.CAPTURING_PHASE;
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
      eventPhase =
        eventTarget === event.target
          ? EventShim.AT_TARGET
          : EventShim.BUBBLING_PHASE;
      const eventListeners = eventTarget.__eventListeners.get(event.type);
      if (eventListeners) {
        for (const [listener, options] of eventListeners) {
          invokeEventListener(listener, options, eventListeners);
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
  private __resolveFullEventPath(): EventTarget[] {
    if (this.__eventPathCache) {
      return this.__eventPathCache;
    } else if (!this.__eventTargetParent) {
      return (this.__eventPathCache = [this, documentShim, windowShim]);
    } else {
      return (this.__eventPathCache = [
        this,
        ...this.__eventTargetParent.__resolveFullEventPath(),
      ]);
    }
  }
}

const EventTargetShimWithRealType =
  EventTarget as object as typeof globalThis.EventTarget;
export {EventTargetShimWithRealType as EventTarget};

const attributes = new WeakMap<
  InstanceType<typeof HTMLElementShim>,
  Map<string, string>
>();
const attributesForElement = (
  element: InstanceType<typeof HTMLElementShim>
) => {
  let attrs = attributes.get(element);
  if (attrs === undefined) {
    attributes.set(element, (attrs = new Map()));
  }
  return attrs;
};

// The typings around the exports below are a little funky:
//
// 1. We want the `name` of the shim classes to match the real ones at runtime,
//    hence e.g. `class Element`.
// 2. We can't shadow the global types with a simple class declaration, because
//    then we can't reference the global types for casting, hence e.g.
//    `const ElementShim = class Element`.
// 3. We want to export the classes typed as the real ones, hence e.g.
//    `const ElementShimWithRealType = ElementShim as object as typeof Element;`.
// 4. We want the exported names to match the real ones, hence e.g.
//    `export {ElementShimWithRealType as Element}`.
const NodeShim = class Node extends EventTarget {
  getRootNode(options?: GetRootNodeOptions): globalThis.Node {
    if (options?.composed) {
      return document;
    }
    // getRootNode returns the containing ShadowRoot instance, even if that was
    // created in closed mode.
    const host = (this as Partial<EventTargetShimMeta>).__host as
      | typeof ElementShim
      | undefined;
    return (
      (host as {__shadowRoot?: null | ShadowRoot})?.__shadowRoot ?? document
    );
  }
};
const NodeShimWithRealType = NodeShim as object as typeof Node;
export {NodeShimWithRealType as Node};

type DocumentInterface = Document;

const DocumentShim = class Document
  extends NodeShim
  implements Partial<DocumentInterface>
{
  get adoptedStyleSheets() {
    return [];
  }
  createTreeWalker() {
    return {} as TreeWalker;
  }
  createTextNode() {
    return {} as Text;
  }
  createElement() {
    return {} as HTMLElement;
  }
};
const DocumentShimWithRealType = DocumentShim as object as typeof Document;
export {DocumentShimWithRealType as Document};

const documentShim = new DocumentShim();
const document: Document = documentShim as object as typeof document;
export {document};

type WindowInterface = Window;

const WindowShim = class Window
  extends NodeShim
  implements Partial<WindowInterface>
{
  [index: number]: WindowInterface;

  constructor();
  /**
   * @internal
   */
  constructor(constructionToken: Symbol);
  constructor(token?: Symbol) {
    super();
    if (token !== constructionToken) {
      throw new TypeError('Illegal constructor');
    }

    Object.assign(this, globalThis, {
      CustomElementRegistry,
      customElements,
      document,
      Document: DocumentShim,
      Element: ElementShim,
      EventTarget,
      HTMLElement: HTMLElementShim,
      Node: NodeShim,
      ShadowRoot: ShadowRootShim,
      window: this,
      Window: WindowShim,
    });
  }
};
const WindowShimWithRealType = WindowShim as object as typeof Window;
export {WindowShimWithRealType as Window};

const ElementShim = class Element extends NodeShim {
  get attributes() {
    return Array.from(attributesForElement(this)).map(([name, value]) => ({
      name,
      value,
    }));
  }
  private __shadowRootMode: null | ShadowRootMode = null;
  protected __shadowRoot: null | ShadowRoot = null;
  protected __internals: null | ElementInternals = null;

  get shadowRoot() {
    if (this.__shadowRootMode === 'closed') {
      return null;
    }
    return this.__shadowRoot;
  }
  get localName() {
    return (this.constructor as NamedCustomHTMLElementConstructor).__localName;
  }
  get tagName() {
    return this.localName?.toUpperCase();
  }
  setAttribute(name: string, value: unknown): void {
    // Emulate browser behavior that silently casts all values to string. E.g.
    // `42` becomes `"42"` and `{}` becomes `"[object Object]""`.
    attributesForElement(this).set(name, String(value));
  }
  removeAttribute(name: string) {
    attributesForElement(this).delete(name);
  }
  toggleAttribute(name: string, force?: boolean): boolean {
    // Steps reference https://dom.spec.whatwg.org/#dom-element-toggleattribute
    if (this.hasAttribute(name)) {
      // Step 5
      if (force === undefined || !force) {
        this.removeAttribute(name);
        return false;
      }
    } else {
      // Step 4
      if (force === undefined || force) {
        // Step 4.1
        this.setAttribute(name, '');
        return true;
      } else {
        // Step 4.2
        return false;
      }
    }
    // Step 6
    return true;
  }
  hasAttribute(name: string) {
    return attributesForElement(this).has(name);
  }
  attachShadow(init: ShadowRootInit): ShadowRoot {
    this.__shadowRootMode = init.mode;
    const shadowRoot: Partial<ShadowRootInterface> & EventTargetShimMeta =
      new ShadowRootShim(constructionToken, init);
    shadowRoot.__eventTargetParent = this;
    shadowRoot.__host = this;
    return (this.__shadowRoot = shadowRoot as ShadowRootInterface);
  }
  attachInternals(): ElementInternals {
    if (this.__internals !== null) {
      throw new Error(
        `Failed to execute 'attachInternals' on 'HTMLElement': ` +
          `ElementInternals for the specified element was already attached.`
      );
    }
    const internals = new ElementInternalsShim(this as unknown as HTMLElement);
    this.__internals = internals;
    return internals as ElementInternals;
  }
  getAttribute(name: string) {
    const value = attributesForElement(this).get(name);
    return value ?? null;
  }
};
const ElementShimWithRealType = ElementShim as object as typeof Element;
export {ElementShimWithRealType as Element};

const HTMLElementShim = class HTMLElement extends ElementShim {};
const HTMLElementShimWithRealType =
  HTMLElementShim as object as typeof HTMLElement;
export {HTMLElementShimWithRealType as HTMLElement};

const HTMLSlotElementShim = class HTMLSlotElement extends HTMLElementShim {
  name!: string;
  override get localName(): string {
    return 'slot';
  }
};
const HTMLSlotElementShimWithRealType =
  HTMLSlotElementShim as object as typeof HTMLSlotElement;
export {HTMLSlotElementShimWithRealType as HTMLSlotElement};

type ShadowRootInterface = ShadowRoot;

const ShadowRootShim = class ShadowRoot
  extends NodeShim
  implements Partial<ShadowRootInterface>
{
  get host(): Element {
    return (this as Partial<EventTargetShimMeta>).__host! as Element;
  }
  mode: 'open' | 'closed';

  constructor();
  /**
   * @internal
   */
  constructor(constructionToken: Symbol, init: ShadowRootInit);
  constructor(constructionToken?: Symbol, init?: ShadowRootInit) {
    super();
    if (constructionToken !== constructionToken) {
      throw new TypeError('Illegal constructor');
    }
    this.mode = init!.mode;
  }
};
const ShadowRootShimWithRealType =
  ShadowRootShim as object as typeof ShadowRoot;
export {ShadowRootShimWithRealType as ShadowRoot};

// For convenience, we provide a global instance of a HTMLElement as an event
// target. This facilitates registering global event handlers
// (e.g. for @lit/context ContextProvider).
// We use this in in the SSR render function.
// Note, this is a bespoke element and not simply `document` or `window` since
// user code relies on these being undefined in the server environment.
globalThis.litServerRoot ??= Object.defineProperty(
  new HTMLElementShimWithRealType(),
  'localName',
  {
    // Patch localName (and tagName) to return a unique name.
    get() {
      return 'lit-server-root';
    },
  }
);

interface CustomHTMLElementConstructor {
  new (): HTMLElement;
  observedAttributes?: string[];
}

interface NamedCustomHTMLElementConstructor
  extends CustomHTMLElementConstructor {
  __localName: string;
}

type CustomElementRegistration = {
  ctor: {new (): HTMLElement};
  observedAttributes: string[];
};

type RealCustomElementRegistry = (typeof globalThis)['customElements'];
type RealCustomElementRegistryClass =
  (typeof globalThis)['CustomElementRegistry'];

// Ponyfill for PromiseWithResolvers, remove once we can assume its presence.
type PromiseWithResolvers<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
};
function promiseWithResolvers<T>(): PromiseWithResolvers<T> {
  let resolve: (value: T) => void;
  let reject: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return {promise, resolve: resolve!, reject: reject!};
}

class CustomElementRegistry implements RealCustomElementRegistry {
  private __definitions = new Map<string, CustomElementRegistration>();
  private __reverseDefinitions = new Map<
    CustomHTMLElementConstructor,
    string
  >();
  private __pendingWhenDefineds = new Map<
    string,
    PromiseWithResolvers<CustomElementConstructor>
  >();

  define(name: string, ctor: CustomHTMLElementConstructor) {
    if (this.__definitions.has(name)) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `'CustomElementRegistry' already has "${name}" defined. ` +
            `This may have been caused by live reload or hot module ` +
            `replacement in which case it can be safely ignored.\n` +
            `Make sure to test your application with a production build as ` +
            `repeat registrations will throw in production.`
        );
      } else {
        throw new Error(
          `Failed to execute 'define' on 'CustomElementRegistry': ` +
            `the name "${name}" has already been used with this registry`
        );
      }
    }
    if (this.__reverseDefinitions.has(ctor)) {
      throw new Error(
        `Failed to execute 'define' on 'CustomElementRegistry': ` +
          `the constructor has already been used with this registry for the ` +
          `tag name ${this.__reverseDefinitions.get(ctor)}`
      );
    }
    // Provide tagName and localName for the component.
    (ctor as NamedCustomHTMLElementConstructor).__localName = name;
    this.__definitions.set(name, {
      ctor,
      // Note it's important we read `observedAttributes` in case it is a getter
      // with side-effects, as is the case in Lit, where it triggers class
      // finalization.
      //
      // TODO(aomarks) To be spec compliant, we should also capture the
      // registration-time lifecycle methods like `connectedCallback`. For them
      // to be actually accessible to e.g. the Lit SSR element renderer, though,
      // we'd need to introduce a new API for accessing them (since `get` only
      // returns the constructor).
      observedAttributes: ctor.observedAttributes ?? [],
    });
    this.__reverseDefinitions.set(ctor, name);
    this.__pendingWhenDefineds.get(name)?.resolve(ctor);
    this.__pendingWhenDefineds.delete(name);
  }

  get(name: string) {
    const definition = this.__definitions.get(name);
    return definition?.ctor;
  }

  getName(ctor: CustomHTMLElementConstructor) {
    return this.__reverseDefinitions.get(ctor) ?? null;
  }

  upgrade(_element: HTMLElement) {
    // In SSR this doesn't make a lot of sense, so we do nothing.
    throw new Error(
      `customElements.upgrade is not currently supported in SSR. ` +
        `Please file a bug if you need it.`
    );
  }

  async whenDefined(name: string): Promise<CustomElementConstructor> {
    const definition = this.__definitions.get(name);
    if (definition) {
      return definition.ctor;
    }
    let withResolvers = this.__pendingWhenDefineds.get(name);
    if (!withResolvers) {
      withResolvers = promiseWithResolvers<CustomElementConstructor>();
      this.__pendingWhenDefineds.set(name, withResolvers);
    }
    return withResolvers.promise;
  }
}

const CustomElementRegistryShimWithRealType =
  CustomElementRegistry as object as RealCustomElementRegistryClass;
export {CustomElementRegistryShimWithRealType as CustomElementRegistry};

export const customElements = new CustomElementRegistryShimWithRealType();

// The window variable instantiation must happen after all shims
// have been declared, as they will be included in the window instance.
const windowShim = new WindowShim(constructionToken);
const window: Window = windowShim as object as typeof window;
export {window};
