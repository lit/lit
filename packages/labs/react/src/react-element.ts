/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ReactiveElement, PropertyValues} from '@lit/reactive-element';
export * from '@lit/reactive-element';
export * from '@lit/reactive-element/decorators';
import type * as ReactModule from 'react';
import type * as ReactDOMModule from 'react-dom';

type React = typeof ReactModule;
type ReactDOM = typeof ReactDOMModule;

/**
 * A base class for wrapping React components as reactive web components.
 *
 * @example
 *
 * ```ts
 * import {MyComponent} from './my-component.js';
 *
 * @customElement('my-element')
 * export class MyElement extends ReactElement {
 *   @property()
 *   foo: string;
 *
 *   render() {
 *     return <MyComponent foo={this.foo} onBar={this._onBar}></MyComponent>;
 *   }
 *
 *   private _onBar = (data: BarData) => {
 *     this.dispatchEvent(new BarEvent(data));
 *   }
 * }
 *
 * class BarEvent extends Event {
 *   data: BarData;
 *   constructor(data: BarData) {
 *     super('bar-event', {bubbles: true, composed: true});
 *     this.data = data;
 *   }
 * }
 * ```
 *
 * This class defaults to loading `React` and `ReactDOM` off of `window`. You
 * can change this by setting the static `React` and `ReactDOM` references.
 * This is useful if you're using the CJS build of React with a bundler so that
 * you can import React:
 *
 * ```ts
 * import * as React from 'react';
 * import * as ReactDOM from 'react-dom';
 *
 * export class MyElement extends ReactElement {
 *   static React = React;
 *   static ReactDOM = ReactDOM;
 * }
 * ```
 */
export class ReactElement extends ReactiveElement {
  static ReactDOM: ReactDOM = window.ReactDOM;
  static React: React = window.React;

  override update(changedProperties: PropertyValues) {
    const vdom = this.render();
    super.update(changedProperties);
    const reactDOM = (this.constructor as typeof ReactElement).ReactDOM;
    reactDOM.render(vdom, this.renderRoot);
  }

  protected render():
    | React.ReactElement
    | React.DOMElement<
        React.HTMLAttributes<unknown> | React.SVGAttributes<unknown>,
        Element
      > {
    const react = (this.constructor as typeof ReactElement).React;
    return react.createElement(react.Fragment);
  }
}
