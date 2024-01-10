/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html, css} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {Foo, Bar as Baz} from './package-stuff.js';

/**
 * This is a description of my element. It's pretty great. The description has
 * text that spans multiple lines.
 *
 * @summary My awesome element
 * @fires a-changed - An awesome event to fire
 * @slot default - The default slot
 * @slot stuff - A slot for stuff
 * @cssProperty --foreground-color - The foreground color
 * @cssProp --background-color The background color
 * @cssPart header The header
 * @cssPart footer - The footer
 */
@customElement('element-a')
export class ElementA extends LitElement {
  static override styles = css`
    :host {
      display: block;
      background-color: var(--background-color);
      color: var(-foreground-color);
    }
  `;

  @property()
  foo?: string;

  override render() {
    return html`
      <h1 part="header">${this.foo}</h1>
      <slot></slot>
      <slot name="stuff"></slot>
      <footer part="footer">Footer</footer>
    `;
  }
}

export let localTypeVar: ElementA;
export let packageTypeVar: Foo<Baz>;
export let externalTypeVar: LitElement;
export let globalTypeVar: HTMLElement;

export {Foo, Baz, localTypeVar as local};
