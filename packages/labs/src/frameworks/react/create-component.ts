/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
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

import * as ReactModule from 'react';

const reservedReactProperties = new Set([
  'children',
  'localName',
  'ref',
  // TODO(sorvell): why are the properties below included?
  'style',
  'className',
]);

const listenedEvents: WeakMap<
  Element,
  Map<string, EventListenerObject>
> = new WeakMap();

const setEvent = (
  node: Element,
  event: string,
  value: (event?: Event) => void
) => {
  let events = listenedEvents.get(node);
  if (events === undefined) {
    listenedEvents.set(node, (events = new Map()));
  }
  let handler = events.get(event);
  if (value !== undefined) {
    // If necessary, add listener and track handler
    if (handler === undefined) {
      events.set(event, (handler = {handleEvent: value}));
      node.addEventListener(event, handler);
      // Otherwise just update the listener with new value
    } else {
      handler.handleEvent = value;
    }
    // Remove listener if one exists and value is undefined
  } else if (handler !== undefined) {
    events.delete(event);
    node.removeEventListener(event, handler);
  }
};

const setProperty = <E extends Element, T>(
  node: E,
  name: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  old: any,
  events?: T
) => {
  // Dirty check and prevent setting reserved properties.
  if (value === old || reservedReactProperties.has(name as string)) {
    return;
  }
  // For events, use an explicit list.
  const event = (events?.[name as keyof T] as unknown) as string;
  if (event !== undefined) {
    setEvent(node, event, value);
  } else {
    node[name as keyof E] = value;
  }
};

// Note, this is a custom type used for forwarding an outer Ref to the inner
// web component. Our use case here is somewhat unique in that, we need to
// pass the user's ref forward but also intercept the ref value ourselves
// for use in the component wrapper.
type ForwardedRef = {
  __forwardedRef?: React.Ref<unknown>;
};

type Events<S> = {
  [P in keyof S]?: (e: Event) => unknown;
};

const componentMap: Map<
  string,
  React.ForwardRefExoticComponent<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    React.PropsWithChildren<React.PropsWithRef<any>>
  >
> = new Map();

type Constructor<T> = {new (): T};

/**
 *  Creates a React component from a CustomElement.
 */
export const createComponent = <
  C extends Constructor<I>,
  I extends HTMLElement,
  E
>(
  React: typeof ReactModule,
  tagName: string,
  elementClass: C,
  events?: E
) => {
  const Component = React.Component;
  const createElement = React.createElement;

  type ElementProps = Partial<I> & Events<E>;

  type Props = React.PropsWithoutRef<ElementProps> & ForwardedRef;

  // Use cached value if available.
  let ComponentClass = componentMap.get(tagName);
  if (ComponentClass !== undefined) {
    return ComponentClass as React.ForwardRefExoticComponent<
      React.PropsWithChildren<React.PropsWithRef<ElementProps>>
    >;
  }

  // List of properties/events which should be specially handled by the wrapper
  // and not handled directly by React.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const elementProps: {[index: string]: any} = {...(events ?? {})};
  for (const p in elementClass.prototype) {
    if (!(p in HTMLElement.prototype)) {
      elementProps[p] = true;
    }
  }

  class ReactComponent extends Component<Props> {
    private _element!: I;

    private _elementProps!: typeof elementProps;

    private _ref = (element: I) => {
      this._element = element;
      // Fulfill any ref we receive in our props.
      // The `ref` prop is special and cannot be accessed without an error
      // so use `__forwardedRef` via `React.forwardRef`.
      const forwardedRef = this.props?.__forwardedRef;
      if (forwardedRef) {
        // Note, there are 2 kinds of refs and we manually fulfill them here.
        // There is no built in React API for this.
        if (typeof forwardedRef === 'function') {
          (forwardedRef as (e: I) => void)(element);
        } else {
          // This has to be `any` because `current` is readonly.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (forwardedRef as any).current = element;
        }
      }
    };

    private _updateElement(oldProps?: Props) {
      // Set element properties to the values in `this.props`
      for (const prop in this._elementProps) {
        setProperty(
          this._element,
          prop,
          this.props[prop as keyof Props],
          oldProps ? oldProps[prop as keyof Props] : undefined,
          events
        );
      }
      // Note, the spirit of React might be to "unset" any old values that
      // are no longer included; however, there's no reasonable value to set
      // them to so we just leave the previous state as is.
    }

    /**
     * Updates element properties correctly setting properties
     * on mount.
     */
    componentDidMount() {
      this._updateElement();
    }

    /**
     * Updates element properties correctly setting properties
     * on every update. Note, this does not include mount.
     */
    componentDidUpdate(old: Props) {
      this._updateElement(old);
    }

    /**
     * Renders creates the custom element with a `ref` prop which allows this
     * component to reference the custom element.
     *
     * Note, element properties are updated in DidMount/DidUpdate.
     *
     */
    render() {
      // Filter class properties out of React's props and pass the remaining
      // attributes to React. This allows attributes to use React's rules
      // for setting attributes and render correctly under SSR.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const props: any = {ref: this._ref};
      // Note, save element props while iterating to avoid the need to
      // iterate again when setting properties.
      this._elementProps = {};
      for (const p in this.props) {
        const v = this.props[p as keyof Props];
        if (elementProps[p]) {
          this._elementProps[p] = v;
        } else {
          props[p as keyof Props] = v;
        }
      }
      return createElement(tagName, props, props.children);
    }
  }

  ComponentClass = React.forwardRef(
    (
      props?: React.PropsWithChildren<React.PropsWithRef<ElementProps>>,
      ref?: React.Ref<unknown>
    ) =>
      createElement(
        ReactComponent,
        {...props, __forwardedRef: ref} as Props,
        props?.children
      )
  );

  // cache component
  componentMap.set(tagName, ComponentClass);
  return ComponentClass;
};
