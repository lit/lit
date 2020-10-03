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

const setProperty = (node: Element, name: string, value: any) => {
  if (reservedReactProperties.has(name)) {
    return;
  }
  if (name in node) {
    (node as any)[name] = value;
  } else {
    if (value == null) {
      node.removeAttribute(name);
    } else {
      node.setAttribute(name, value);
    }
  }
};

const isCustomElement = (tagName: any) =>
  typeof tagName === 'string' && customElements.get(tagName);

/**
 *
 * @param React React module.
 */
export const createElementFactory = (React: any) => {
  const createElement = React.createElement;
  return (type: any, props?: any, ...children: ReactModule.ReactNode[]) => {
    if (isCustomElement(type)) {
      type = getElementComponent(React, type);
    }
    return createElement(type, props, ...children);
  };
};

const elementComponents: Map<string, any> = new Map();
/**
 *  Gets a React component for a CustomElement.
 */
export const getElementComponent = (React: any, tagName: string) => {
  let component = elementComponents.get(tagName);
  if (component === undefined) {
    elementComponents.set(
      tagName,
      (component = createElementComponent(React, tagName))
    );
  }
  return component;
};

/**
 *  Creates a React component from a CustomElement.
 */
export const createElementComponent = <T extends HTMLElement>(
  React: any,
  tagName: string
): ReactModule.ComponentClass<T, void> => {
  const Component: ReactModule.ComponentClass = React.Component;
  const createElement: typeof ReactModule.createElement = React.createElement;

  return (class extends Component {
    element!: T;

    ref = (element: T) => {
      this.element = element;
      // Fulfill any ref we receive in our props
      // Ref is a special property so we use `elementRef`.
      if ((this.props as any).elementRef) {
        (this.props as any).elementRef.current = element;
      }
    };

    updateElement(oldProps?: any) {
      if (oldProps === undefined) {
        for (const prop in this.props) {
          setProperty(this.element, prop, (this.props as any)[prop]);
        }
      } else {
        for (const prop in this.props) {
          if ((this.props as any)[prop] !== oldProps[prop]) {
            setProperty(this.element, prop, (this.props as any)[prop]);
          }
        }
        for (const prop in oldProps) {
          if (!(prop in this.props)) {
            setProperty(this.element, prop, null);
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
     * on every render (other than mount).
     */
    componentDidUpdate(old: any) {
      this.updateElement(old);
    }

    /**
     * Renders creates the custom element with the props passed from `this.props`
     * and a `ref` prop which allows this component to reference the
     * custom element.
     *
     * Note, react will set all props it doesn't understand to be
     * native properties (e.g. input.value) as attributes.
     *
     */
    render() {
      return createElement(tagName, {ref: this.ref}, this.props.children);
    }
  } as any) as ReactModule.ComponentClass<T, void>;
};
