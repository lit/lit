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

// TODO: Write a UMD->module shim or take React as an argument to
// createReactComponent so we don't have to worry about how to load React.
import * as ReactModule from 'react';

const reservedReactProperties = new Set([
  'children',
  'localName',
  'ref',
  // TODO(sorvell): can we use forwardRef to avoid this?
  'elementRef',
  // TODO(sorvell): why are the properties below included?
  'style',
  'className',
]);

interface ComponentEvents {
  [index: string]: string;
}

const setProperty = (
  node: Element,
  name: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  old: any,
  events: ComponentEvents
) => {
  // Dirty check and prevent setting reserved properties.
  if (Object.is(value, old) || reservedReactProperties.has(name)) {
    return;
  }
  // For events, use an explicit list.
  const event = events[name];
  if (event !== undefined) {
    if (old !== undefined) {
      node.removeEventListener(event, old);
    }
    node.addEventListener(event, value);
  } else {
    // For properties, use an `in` check
    if (name in node) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (node as any)[name] = value;
      // And for everything else, set the attribute.
    } else if (value == null) {
      node.removeAttribute(name);
    } else {
      node.setAttribute(name, value);
    }
  }
};

/**
 *  Creates a React component from a CustomElement.
 */
export const createComponent = <T extends HTMLElement>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  React: any,
  tagName: string,
  events: ComponentEvents = {}
): ReactModule.ComponentClass<T, void> => {
  const Component: ReactModule.ComponentClass = React.Component;
  const createElement: typeof ReactModule.createElement = React.createElement;

  const CustomElement = customElements.get(tagName);

  interface ReactComponentProps
    extends ReactModule.ComponentProps<typeof CustomElement> {
    __forwardedRef: React.Ref<Node>;
  }

  class ReactComponent extends Component {
    element!: T;

    props!: ReactComponentProps;

    ref = (element: T) => {
      this.element = element;
      // Fulfill any ref we receive in our props.
      // The `ref` prop is special and cannot be accessed without an error
      // so use `__forwardedRef` via `React.forwardRef`.
      const forwardedRef = this.props?.__forwardedRef;
      if (forwardedRef) {
        // TODO(sorvell): You're not support to set this yourself, but it
        // doesn't seem like there's good support for forwarding a ref and
        // also using it yourself.
        if (typeof forwardedRef === 'function') {
          forwardedRef(element);
        } else {
          // This has to be `any` because `current` is readonly.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (forwardedRef as any).current = element;
        }
      }
    };

    updateElement(oldProps?: ReactComponentProps) {
      // Set element properties to the values in `this.props`
      for (const prop in this.props) {
        setProperty(
          this.element,
          prop,
          this.props[prop],
          oldProps ? oldProps[prop] : undefined,
          events
        );
      }

      // TODO(sorvell): there's no safe value to set here.
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
      this.updateElement();
    }

    /**
     * Updates element properties correctly setting attributes v. properties
     * on every update. Note, this does not include mount.
     */
    componentDidUpdate(old: ReactComponentProps) {
      this.updateElement(old);
    }

    /**
     * Renders creates the custom element with a `ref` prop which allows this
     * component to reference the custom element.
     *
     * Note, element properties are updated in DidMount/DidUpdate.
     *
     */
    render() {
      return createElement(tagName, {ref: this.ref}, this.props.children);
    }
  }

  return React.forwardRef(
    (props: ReactComponentProps, ref: React.Ref<Node>) => {
      props = {...props, __forwardedRef: ref};
      return createElement(
        ReactComponent,
        props as React.Attributes,
        props.children
      );
    }
  );
};
