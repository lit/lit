/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

// Match a prop name to a typed event callback by
// adding an Event type as an expected property on a string.
export type EventName<T extends Event = Event> = string & {
  __event_type: T;
};

// A key value map matching React prop names to event names
type EventNames = Record<string, EventName | string>;

// A map of expected event listener types based on EventNames
type EventListeners<R extends EventNames> = {
  [K in keyof R]: R[K] extends EventName
    ? (e: R[K]['__event_type']) => void
    : (e: Event) => void;
};

type ReactProps<I, E> = Omit<React.HTMLAttributes<I>, keyof E>;
type ElementWithoutPropsOrEventListeners<I, E> = Omit<
  I,
  keyof E | keyof ReactProps<I, E>
>;

// Props the user is allowed to use, includes standard attributes, children,
// ref, as well as special event and element properties.
export type WebComponentProps<
  I extends HTMLElement,
  E extends EventNames = {}
> = Partial<
  ReactProps<I, E> &
    ElementWithoutPropsOrEventListeners<I, E> &
    EventListeners<E>
>;

// Props used by this component wrapper. This is the WebComponentProps and the
// special `__forwardedRef` property. Note, this ref is special because
// it's both needed in this component to get access to the rendered element
// and must fulfill any ref passed by the user.
type ReactComponentProps<
  I extends HTMLElement,
  E extends EventNames = {}
> = WebComponentProps<I, E> & {
  __forwardedRef: React.Ref<I>;
};

export type ReactWebComponent<
  I extends HTMLElement,
  E extends EventNames = {}
> = React.ForwardRefExoticComponent<
  React.PropsWithoutRef<WebComponentProps<I, E>> & React.RefAttributes<I>
>;

interface Options<I extends HTMLElement, E extends EventNames = {}> {
  tagName: string;
  elementClass: Constructor<I>;
  react: typeof window.React;
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

const listenedEvents: WeakMap<
  Element,
  Map<string, EventListenerObject>
> = new WeakMap();

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
  if (event !== undefined && value !== old) {
    // Dirty check event value.
    addOrUpdateEventListener(node, event, value as (e?: Event) => void);
    return;
  }

  // Note, the attribute removal here for `undefined` and `null` values is done
  // to match React's behavior on non-custom elements. It needs special
  // handling because it does not match platform behavior.  For example,
  // setting the `id` property to `undefined` sets the attribute to the string
  // "undefined." React "fixes" that odd behavior and the code here matches
  // React's convention.
  if (
    (value === undefined || value === null) &&
    name in HTMLElement.prototype
  ) {
    node.removeAttribute(name);
    return;
  }

  // But don't dirty check properties; elements are assumed to do this.
  node[name as keyof E] = value as E[keyof E];
};

// Set a React ref. Note, there are 2 kinds of refs and there's no built in
// React API to set a ref.
const setRef = (ref: React.Ref<unknown>, value: Element | null) => {
  if (typeof ref === 'function') {
    ref(value);
  } else {
    (ref as {current: Element | null}).current = value;
  }
};

/**
 * Creates a React component for a custom element. Properties are distinguished
 * from attributes automatically, and events can be configured so they are
 * added to the custom element as event listeners.
 *
 * @param options An options bag containing the parameters needed to generate
 * a wrapped web component.
 *
 * @param options.react The React module, typically imported from the `react` npm
 * package.
 * @param options.tagName The custom element tag name registered via
 * `customElements.define`.
 * @param options.elementClass The custom element class registered via
 * `customElements.define`.
 * @param options.events An object listing events to which the component can listen. The
 * object keys are the event property names passed in via React props and the
 * object values are the names of the corresponding events generated by the
 * custom element. For example, given `{onactivate: 'activate'}` an event
 * function may be passed via the component's `onactivate` prop and will be
 * called when the custom element fires its `activate` event.
 * @param options.displayName A React component display name, used in debugging
 * messages. Default value is inferred from the name of custom element class
 * registered via `customElements.define`.
 */
export function createComponent<
  I extends HTMLElement,
  E extends EventNames = {}
>(options: Options<I, E>): ReactWebComponent<I, E>;
/**
 * @deprecated Use `createComponent(options)` instead of individual arguments.
 *
 * Creates a React component for a custom element. Properties are distinguished
 * from attributes automatically, and events can be configured so they are
 * added to the custom element as event listeners.
 *
 * @param React The React module, typically imported from the `react` npm
 * package.
 * @param tagName The custom element tag name registered via
 * `customElements.define`.
 * @param elementClass The custom element class registered via
 * `customElements.define`.
 * @param events An object listing events to which the component can listen. The
 * object keys are the event property names passed in via React props and the
 * object values are the names of the corresponding events generated by the
 * custom element. For example, given `{onactivate: 'activate'}` an event
 * function may be passed via the component's `onactivate` prop and will be
 * called when the custom element fires its `activate` event.
 * @param displayName A React component display name, used in debugging
 * messages. Default value is inferred from the name of custom element class
 * registered via `customElements.define`.
 */
export function createComponent<
  I extends HTMLElement,
  E extends EventNames = {}
>(
  ReactOrOptions: typeof window.React,
  tagName: string,
  elementClass: Constructor<I>,
  events?: E,
  displayName?: string
): ReactWebComponent<I, E>;
export function createComponent<
  I extends HTMLElement,
  E extends EventNames = {}
>(
  ReactOrOptions: typeof window.React | Options<I, E> = window.React,
  tagName?: string,
  elementClass?: Constructor<I>,
  events?: E,
  displayName?: string
): ReactWebComponent<I, E> {
  // digest overloaded parameters
  let React: typeof window.React;
  let tag: string;
  let element: Constructor<I>;
  if (tagName === undefined) {
    const options = ReactOrOptions as Options<I, E>;
    ({tagName: tag, elementClass: element, events, displayName} = options);
    React = options.react;
  } else {
    React = ReactOrOptions as typeof window.React;
    element = elementClass as Constructor<I>;
    tag = tagName;
  }

  const Component = React.Component;
  const createElement = React.createElement;
  const eventProps = new Set(Object.keys(events ?? {}));

  type Props = ReactComponentProps<I, E>;

  class ReactComponent extends Component<Props> {
    private _element: I | null = null;
    private _elementProps!: Record<string, unknown>;
    private _forwardedRef?: React.Ref<I>;
    private _ref?: React.RefCallback<I>;

    static displayName = displayName ?? element.name;

    private _updateElement(oldProps?: Props) {
      if (this._element === null) {
        return;
      }
      // Set element properties to the values in `this.props`
      for (const prop in this._elementProps) {
        setProperty(
          this._element,
          prop,
          this.props[prop],
          oldProps ? oldProps[prop] : undefined,
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
    override componentDidMount() {
      this._updateElement();
    }

    /**
     * Updates element properties correctly setting properties
     * on every update. Note, this does not include mount.
     */
    override componentDidUpdate(old: Props) {
      this._updateElement(old);
    }

    /**
     * Renders the custom element with a `ref` prop which allows this
     * component to reference the custom element.
     *
     * Standard attributes are passed to React and element properties and events
     * are updated in componentDidMount/componentDidUpdate.
     *
     */
    override render() {
      // Extract and remove __forwardedRef from userProps in a rename-safe way
      const {__forwardedRef, ...userProps} = this.props;
      // Since refs only get fulfilled once, pass a new one if the user's ref
      // changed. This allows refs to be fulfilled as expected, going from
      // having a value to null.
      if (this._forwardedRef !== __forwardedRef) {
        this._ref = (value: I | null) => {
          if (__forwardedRef !== null) {
            setRef(__forwardedRef, value);
          }

          this._element = value;
          this._forwardedRef = __forwardedRef;
        };
      }
      // Save element props while iterating to avoid the need to iterate again
      // when setting properties.
      this._elementProps = {};
      const props: Record<string, unknown> = {ref: this._ref};
      // Filters class properties and event properties out and passes the
      // remaining attributes to React. This allows attributes to use framework
      // rules for setting attributes and render correctly under SSR.
      for (const [k, v] of Object.entries(userProps)) {
        if (reservedReactProperties.has(k)) {
          // React does *not* handle `className` for custom elements so
          // coerce it to `class` so it's handled correctly.
          props[k === 'className' ? 'class' : k] = v;
          continue;
        }

        if (eventProps.has(k) || k in element.prototype) {
          this._elementProps[k] = v;
          continue;
        }

        props[k] = v;
      }
      return createElement<React.HTMLAttributes<I>, I>(tag, props);
    }
  }

  const ForwardedComponent: ReactWebComponent<I, E> = React.forwardRef<
    I,
    WebComponentProps<I, E>
  >((props, __forwardedRef) =>
    createElement<Props, ReactComponent, typeof ReactComponent>(
      ReactComponent,
      {...props, __forwardedRef},
      props?.children
    )
  );

  // To ease debugging in the React Developer Tools
  ForwardedComponent.displayName = ReactComponent.displayName;

  return ForwardedComponent;
}
