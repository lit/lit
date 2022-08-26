import {FileTree} from '@lit-labs/gen-utils/lib/file-utils.js';
import {
  javascript,
  kabobToPascalCase,
} from '@lit-labs/gen-utils/lib/str-utils.js';
import {Language} from '../../../../commands/init.js';

export const generateElement = (
  elementName: string,
  language: Language
): FileTree => {
  const directory = language === 'js' ? 'lib' : 'src';
  return {
    [directory]: {
      [`${elementName}.${language}`]:
        language === 'js' ? js(elementName) : ts(elementName),
    },
  };
};

const js = (elementName: string) => {
  const className = kabobToPascalCase(elementName);
  return javascript`/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import { LitElement, html, css } from 'lit';

/**
 * An example element.
 *
 * @fires count-changed - Indicates when the count changes
 * @slot - This element has a slot
 * @csspart button - The button
 */
export class ${className} extends LitElement {
  static get styles() {
    return css\`
      :host {
        display: block;
        border: solid 1px gray;
        padding: 16px;
        max-width: 800px;
      }
    \`;
  }

  static get properties() {
    return {
      /**
       * The name to say "Hello" to.
       * @type {string}
       */
      name: {type: String},

      /**
       * The number of times the button has been clicked.
       * @type {number}
       */
      count: {type: Number},
    };
  }

  constructor() {
    super();
    this.name = 'World';
    this.count = 0;
  }

  render() {
    return html\`
      <h1>\${this._sayHello()}!</h1>
      <button @click=\${this._onClick} part="button">
        Click Count: \${this.count}
      </button>
      <slot></slot>
    \`;
  }

  _onClick() {
    this.count++;
    this.dispatchEvent(new CustomEvent('count-changed'));
  }

  /**
   * Formats a greeting
   * @returns {string} A greeting directed at \`name\`
   */
  _sayHello() {
    return html\`Hello, \${this.name}\`;
  }
}

window.customElements.define('${elementName}', ${className});
`;
};

const ts = (elementName: string) => {
  const className = kabobToPascalCase(elementName);
  return javascript`/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import { LitElement, html, css } from 'lit';
import { property, customElement } from 'lit/decorators.js';

/**
 * An example element.
 *
 * @fires count-changed - Indicates when the count changes
 * @slot - This element has a slot
 * @csspart button - The button
 */
@customElement('${elementName}')
export class ${className} extends LitElement {
  static override styles = css\`
    :host {
      display: block;
      border: solid 1px gray;
      padding: 16px;
      max-width: 800px;
    }
  \`;

  /**
   * The name to say "Hello" to.
   */
  @property()
  name = 'World';

  /**
   * The number of times the button has been clicked.
   */
  @property({ type: Number })
  count = 0;

  override render() {
    return html\`
      <h1>\${this._sayHello()}!</h1>
      <button @click=\${this._onClick} part="button">
        Click Count: \${this.count}
      </button>
      <slot></slot>
    \`;
  }

  protected _onClick() {
    this.count++;
    this.dispatchEvent(new CustomEvent('count-changed'));
  }

  /**
   * Formats a greeting
   */
  protected _sayHello() {
    return \`Hello, \${this.name}\`;
  }
}
`;
};
