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

interface ComponentOptions {
  properties?: {
    [index: string]: string | boolean;
  };
  events?: {
    [index: string]: string;
  };
  hasChanged?: (value: any) => boolean;
}

const propertyName = (name: string, options?: ComponentOptions) => {
  const prop = options?.properties?.[name];
  return (prop === true ? name : (prop as string)) ?? name;
};

const eventName = (name: string, options?: ComponentOptions) =>
  options?.events?.[name];

const notEqual = (value: any, old: any) => !Object.is(value, old);

const setProperty = (
  node: Element,
  name: string,
  value: any,
  old: any,
  options?: ComponentOptions
) => {
  const hasChanged = options?.hasChanged ?? notEqual;
  if (reservedReactProperties.has(name) || !hasChanged(value, old)) {
    return;
  }
  const event = eventName(name, options);
  if (event !== undefined) {
    if (old !== undefined) {
      node.removeEventListener(event, old);
    }
    node.addEventListener(event, value);
  } else {
    const property = propertyName(name, options);
    if (property !== undefined || name in node) {
      (node as any)[property] = value;
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
  React: any,
  tagName: string,
  options?: ComponentOptions
): ReactModule.ComponentClass<T, void> => {
  const Component: ReactModule.ComponentClass = React.Component;
  const createElement: typeof ReactModule.createElement = React.createElement;

  return (class extends Component {
    element!: T;

    ref = (element: T) => {
      this.element = element;
      // Fulfill any ref we receive in our props.
      // The `ref` prop is special and cannot be accessed without an error
      // so use `elementRef`.
      if ((this.props as any).elementRef) {
        (this.props as any).elementRef.current = element;
      }
    };

    updateElement(oldProps?: any) {
      if (oldProps === undefined) {
        for (const prop in this.props) {
          setProperty(
            this.element,
            prop,
            (this.props as any)[prop],
            undefined,
            options
          );
        }
      } else {
        for (const prop in this.props) {
          setProperty(
            this.element,
            prop,
            (this.props as any)[prop],
            oldProps[prop],
            options
          );
        }
        for (const prop in oldProps) {
          if (!(prop in this.props)) {
            setProperty(this.element, prop, null, options);
          }
        }
      }
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
    componentDidUpdate(old: any) {
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
  } as any) as ReactModule.ComponentClass<T, void>;
};
