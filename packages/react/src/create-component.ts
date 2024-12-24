/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import type React from 'react';

const NODE_MODE = false;
const DEV_MODE = true;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DistributiveOmit<T, K extends string | number | symbol> = T extends any
  ? K extends keyof T
    ? Omit<T, K>
    : T
  : T;
type PropsWithoutRef<T> = DistributiveOmit<T, 'ref'>;

/**
 * Creates a type to be used for the props of a web component used directly in
 * React JSX.
 *
 * Example:
 *
 * ```ts
 * declare module "react" {
 *   namespace JSX {
 *     interface IntrinsicElements {
 *       'x-foo': WebComponentProps<XFoo>;
 *     }
 *   }
 * }
 * ```
 */
export type WebComponentProps<I extends HTMLElement> = React.DetailedHTMLProps<
  React.HTMLAttributes<I>,
  I
> &
  ElementProps<I>;

/**
 * Type of the React component wrapping the web component. This is the return
 * type of `createComponent`.
 */
export type ReactWebComponent<
  I extends HTMLElement,
  E extends EventNames = {},
> = React.ForwardRefExoticComponent<
  // TODO(augustjk): Remove and use `React.PropsWithoutRef` when
  // https://github.com/preactjs/preact/issues/4124 is fixed.
  PropsWithoutRef<ComponentProps<I, E>> & React.RefAttributes<I>
>;

// Props derived from custom element class. Currently has limitations of making
// all properties optional and also surfaces life cycle methods in autocomplete.
// TODO(augustjk) Consider omitting keyof LitElement to remove "internal"
// lifecycle methods or allow user to explicitly provide props.
type ElementProps<I> = Partial<Omit<I, keyof HTMLElement>>;

// Acceptable props to the React component.
type ComponentProps<I, E extends EventNames = {}> = Omit<
  React.HTMLAttributes<I>,
  // Prefer type of provided event handler props or those on element over
  // built-in HTMLAttributes
  keyof E | keyof ElementProps<I>
> &
  EventListeners<E> &
  ElementProps<I>;

/**
 * Type used to cast an event name with an event type when providing the
 * `events` option to `createComponent` for better typing of the event handler
 * prop.
 *
 * Example:
 *
 * ```ts
 * const FooComponent = createComponent({
 *   ...
 *   events: {
 *     onfoo: 'foo' as EventName<FooEvent>,
 *   }
 * });
 * ```
 *
 * `onfoo` prop will have the type `(e: FooEvent) => void`.
 */
export type EventName<T extends Event = Event> = string & {
  __eventType: T;
};

// A key value map matching React prop names to event names.
type EventNames = Record<string, EventName | string>;

// A map of expected event listener types based on EventNames.
type EventListeners<R extends EventNames> = {
  [K in keyof R]?: R[K] extends EventName
    ? (e: R[K]['__eventType']) => void
    : (e: Event) => void;
};

export interface Options<I extends HTMLElement, E extends EventNames = {}> {
  react: typeof React;
  tagName: string;
  elementClass: Constructor<I>;
  events?: E;
  displayName?: string;
}

type Constructor<T> = {new (): T};

const reservedReactProperties = new Set([
  'children',
  'localName',
  'ref',
  'style',
  'className',
]);

const listenedEvents = new WeakMap<Element, Map<string, EventListenerObject>>();

/**
 * Adds an event listener for the specified event to the given node. In the
 * React setup, there should only ever be one event listener. Thus, for
 * efficiency only one listener is added and the handler for that listener is
 * updated to point to the given listener function.
 */
const addOrUpdateEventListener = (
  node: Element,
  event: string,
  listener: (event?: Event) => void
) => {
  let events = listenedEvents.get(node);
  if (events === undefined) {
    listenedEvents.set(node, (events = new Map()));
  }
  let handler = events.get(event);
  if (listener !== undefined) {
    // If necessary, add listener and track handler
    if (handler === undefined) {
      events.set(event, (handler = {handleEvent: listener}));
      node.addEventListener(event, handler);
      // Otherwise just update the listener with new value
    } else {
      handler.handleEvent = listener;
    }
    // Remove listener if one exists and value is undefined
  } else if (handler !== undefined) {
    events.delete(event);
    node.removeEventListener(event, handler);
  }
};

/**
 * Sets properties and events on custom elements. These properties and events
 * have been pre-filtered so we know they should apply to the custom element.
 */
const setProperty = <E extends Element>(
  node: E,
  name: string,
  value: unknown,
  old: unknown,
  events?: EventNames
) => {
  const event = events?.[name];
  // Dirty check event value.
  if (event !== undefined) {
    if (value !== old) {
      addOrUpdateEventListener(node, event, value as (e?: Event) => void);
    }
    return;
  }
  // But don't dirty check properties; elements are assumed to do this.
  node[name as keyof E] = value as E[keyof E];

  // This block is to replicate React's behavior for attributes of native
  // elements where `undefined` or `null` values result in attributes being
  // removed.
  // https://github.com/facebook/react/blob/899cb95f52cc83ab5ca1eb1e268c909d3f0961e7/packages/react-dom-bindings/src/client/DOMPropertyOperations.js#L107-L141
  //
  // It's only needed here for native HTMLElement properties that reflect
  // attributes of the same name but don't have that behavior like "id" or
  // "draggable".
  if (
    (value === undefined || value === null) &&
    name in HTMLElement.prototype
  ) {
    node.removeAttribute(name);
  }
};

/**
 * Creates a React component for a custom element. Properties are distinguished
 * from attributes automatically, and events can be configured so they are added
 * to the custom element as event listeners.
 *
 * @param options An options bag containing the parameters needed to generate a
 * wrapped web component.
 *
 * @param options.react The React module, typically imported from the `react`
 * npm package.
 * @param options.tagName The custom element tag name registered via
 * `customElements.define`.
 * @param options.elementClass The custom element class registered via
 * `customElements.define`.
 * @param options.events An object listing events to which the component can
 * listen. The object keys are the event property names passed in via React
 * props and the object values are the names of the corresponding events
 * generated by the custom element. For example, given `{onactivate:
 * 'activate'}` an event function may be passed via the component's `onactivate`
 * prop and will be called when the custom element fires its `activate` event.
 * @param options.displayName A React component display name, used in debugging
 * messages. Default value is inferred from the name of custom element class
 * registered via `customElements.define`.
 */
export const createComponent = <
  I extends HTMLElement,
  E extends EventNames = {},
>({
  react: React,
  tagName,
  elementClass,
  events,
  displayName,
}: Options<I, E>): ReactWebComponent<I, E> => {
  const eventProps = new Set(Object.keys(events ?? {}));

  if (DEV_MODE && !NODE_MODE) {
    for (const p of reservedReactProperties) {
      if (p in elementClass.prototype && !(p in HTMLElement.prototype)) {
        // Note, this effectively warns only for `ref` since the other
        // reserved props are on HTMLElement.prototype. To address this
        // would require crawling down the prototype, which doesn't feel worth
        // it since implementing these properties on an element is extremely
        // rare.
        console.warn(
          `${tagName} contains property ${p} which is a React reserved ` +
            `property. It will be used by React and not set on the element.`
        );
      }
    }
  }

  type Props = ComponentProps<I, E>;

  const ReactComponent = React.forwardRef<I, Props>((props, ref) => {
    const prevElemPropsRef = React.useRef(new Map());
    const elementRef = React.useRef<I | null>(null);

    // Props to be passed to React.createElement
    const reactProps: Record<string, unknown> = {};
    // Props to be set on element with setProperty
    const elementProps: Record<string, unknown> = {};

    for (const [k, v] of Object.entries(props)) {
      if (reservedReactProperties.has(k)) {
        // React does *not* handle `className` for custom elements so
        // coerce it to `class` so it's handled correctly.
        reactProps[k === 'className' ? 'class' : k] = v;
        continue;
      }

      if (eventProps.has(k) || k in elementClass.prototype) {
        elementProps[k] = v;
        continue;
      }

      reactProps[k] = v;
    }

    // useLayoutEffect produces warnings during server rendering.
    if (!NODE_MODE) {
      // This one has no dependency array so it'll run on every re-render.
      React.useLayoutEffect(() => {
        if (elementRef.current === null) {
          return;
        }
        const newElemProps = new Map();
        for (const key in elementProps) {
          setProperty(
            elementRef.current,
            key,
            props[key],
            prevElemPropsRef.current.get(key),
            events
          );
          prevElemPropsRef.current.delete(key);
          newElemProps.set(key, props[key]);
        }
        // "Unset" any props from previous render that no longer exist.
        // Setting to `undefined` seems like the correct thing to "unset"
        // but currently React will set it as `null`.
        // See https://github.com/facebook/react/issues/28203
        for (const [key, value] of prevElemPropsRef.current) {
          setProperty(elementRef.current, key, undefined, value, events);
        }
        prevElemPropsRef.current = newElemProps;
      });

      // Empty dependency array so this will only run once after first render.
      React.useLayoutEffect(() => {
        elementRef.current?.removeAttribute('defer-hydration');
      }, []);
    }

    if (NODE_MODE) {
      // If component is to be server rendered with `@lit/ssr-react`, pass
      // element properties in a special bag to be set by the server-side
      // element renderer.
      if (
        (React.createElement.name === 'litPatchedCreateElement' ||
          globalThis.litSsrReactEnabled) &&
        Object.keys(elementProps).length
      ) {
        // This property needs to remain unminified.
        reactProps['_$litProps$'] = elementProps;
      }
    } else {
      // Suppress hydration warning for server-rendered attributes.
      // This property needs to remain unminified.
      reactProps['suppressHydrationWarning'] = true;
    }

    return React.createElement(tagName, {
      ...reactProps,
      ref: React.useCallback(
        (node: I) => {
          elementRef.current = node;
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref !== null) {
            ref.current = node;
          }
        },
        [ref]
      ),
    });
  });

  ReactComponent.displayName = displayName ?? elementClass.name;

  return ReactComponent;
};
