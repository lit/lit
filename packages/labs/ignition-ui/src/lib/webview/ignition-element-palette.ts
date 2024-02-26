/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, css, html} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import './ignition-element-palette-item.js';

/**
 * The pallete of elements avaiable for drag and drop into the Ignition
 * story editor.
 */
@customElement('ignition-element-palette')
export class IgnitionElementPalette extends LitElement {
  static styles = css`
    :host {
      display: flex;
      padding: 8px;
      gap: 8px;
      flex-wrap: wrap;
      justify-content: flex-start;
      align-content: flex-start;
    }
  `;

  @property()
  elements?: string;

  override render() {
    return elements.map((e) => {
      return html`<ignition-element-palette-item
        draggable="true"
        .elementName=${e.name}
        .iconName=${e.icon}
      ></ignition-element-palette-item>`;
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ignition-element-palette': IgnitionElementPalette;
  }
}

/**
 * The elements available in the palette.
 *
 * Multiple reated tags are grouped under a single item. The editor should allow
 * switching tags (ie <div> to <section>) without the user explicitly replacing
 * the element, possibly via a menu in the inspector.
 */
const elements = [
  {
    name: 'Block',
    tags: [
      'div',
      'p',
      'section',
      'article',
      'header',
      'footer',
      'main',
      'aside',
    ],
    description: 'A block container for other content',
    icon: 'menu',
  },
  {
    name: 'Span',
    tags: ['span', 'a'],
    description: 'An inline container for other content',
    icon: 'symbol-keyword',
  },
  {
    name: 'List',
    tags: ['ul', 'ol', 'dl'],
    description: 'A list',
    icon: 'list-ordered',
  },
  {
    name: 'List Item',
    tags: ['li', 'dt', 'dd'],
    description: 'A list item',
    icon: 'symbol-interface',
  },
  {
    name: 'Button',
    tags: ['button'],
    description: 'A default HTML button',
    icon: 'inspect',
  },
  {
    name: 'Input',
    tags: ['input', 'textarea'],
    description: '',
    icon: 'symbol-string',
  },
];
