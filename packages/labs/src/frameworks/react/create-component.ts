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

const dummyEl = document.createElement(`dummy-element${Math.random()}`);

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
    if (old !== undefined) {
      node.removeEventListener(event, old);
    }
    node.addEventListener(event, value);
  } else {
    // For properties, use an `in` check
    if (name in node && !(name in dummyEl)) {
      node[name as keyof E] = value;
      // And for everything else, set the attribute.
      // Note, this matches standard React behavior to remove attributes if
      // their value is null.
    } else if (value == null) {
      node.removeAttribute(name);
    } else {
      node.setAttribute(name, value);
    }
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

/**
 *  Creates a React component from a CustomElement.
 */
// TODO(sorvell): Was unable to remove type E here.
export const createComponent = <T extends HTMLElement, E>(
  React: typeof ReactModule,
  tagName: string,
  events?: E
) => {
  const Component = React.Component;
  const createElement = React.createElement;

  type ElementProps = Partial<T> & Events<E>;

  type Props = React.PropsWithoutRef<ElementProps> & ForwardedRef;

  // Use cached value if available.
  let ComponentClass = componentMap.get(tagName);
  if (ComponentClass !== undefined) {
    return ComponentClass;
  }

  class ReactComponent extends Component<Props> {
    private _element!: T;

    private _ref = (element: T) => {
      this._element = element;
      // Fulfill any ref we receive in our props.
      // The `ref` prop is special and cannot be accessed without an error
      // so use `__forwardedRef` via `React.forwardRef`.
      const forwardedRef = this.props?.__forwardedRef;
      if (forwardedRef) {
        // Note, there are 2 kinds of refs and we manually fulfill them here.
        // There is no built in React API for this.
        if (typeof forwardedRef === 'function') {
          (forwardedRef as (e: T) => void)(element);
        } else {
          // This has to be `any` because `current` is readonly.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (forwardedRef as any).current = element;
        }
      }
    };

    private _updateElement(oldProps?: Props) {
      // Set element properties to the values in `this.props`
      for (const prop in this.props) {
        setProperty(
          this._element,
          prop,
          this.props[prop as keyof Props],
          oldProps ? oldProps[prop as keyof Props] : undefined,
          events
        );
      }

      // TODO(sorvell): There's no safe value to set here.
      // Unset any `oldProps` that are not currently in `this.props`
      // for (const prop in oldProps) {
      //   if (!(prop in this.props)) {
      //     setProperty(this.element, prop, undefined, oldProps[prop], eventNames);
      //   }
      // }
    }

    /**
     * Updates element properties correctly setting attributes v. properties
     * on mount.
     */
    componentDidMount() {
      this._updateElement();
    }

    /**
     * Updates element properties correctly setting attributes v. properties
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
      const props = {ref: this._ref};
      return createElement(tagName, props, this.props.children);
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
