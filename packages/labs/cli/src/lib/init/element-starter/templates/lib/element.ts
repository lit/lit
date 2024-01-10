/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

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
      [`${elementName}.${language}`]: generateTemplate(elementName, language),
    },
  };
};

const generateTemplate = (elementName: string, lang: Language) => {
  const className = kabobToPascalCase(elementName);
  return javascript`import {LitElement, html, css} from 'lit';${
    lang === 'js'
      ? ''
      : `
import {property, customElement} from 'lit/decorators.js';`
  }

/**
 * An example element.
 *
 * @fires count-changed - Indicates when the count changes
 * @slot - This element has a slot
 * @csspart button - The button
 * @cssprop --${elementName}-font-size - The button's font size
 */${
   lang === 'js'
     ? ''
     : `
@customElement('${elementName}')`
 }
export class ${className} extends LitElement {
  static styles = css\`
    :host {
      display: block;
      border: solid 1px gray;
      padding: 16px;
    }

    button {
      font-size: var(--${elementName}-font-size, 16px);
    }
  \`;

  ${
    lang === 'js'
      ? `static properties = {
    /**
     * The number of times the button has been clicked.
     * @type {number}
     */
    count: {type: Number},
  }

  constructor() {
    super();
    this.count = 0;
  }`
      : `/**
   * The number of times the button has been clicked.
   */
  @property({type: Number})
  count = 0;`
  }

  render() {
    return html\`
      <h1>Hello World</h1>
      <button @click=\${this._onClick} part="button">
        Click Count: \${this.count}
      </button>
      <slot></slot>
    \`;
  }

  ${lang === 'js' ? '' : 'protected '}_onClick() {
    this.count++;
    const event = new Event('count-changed', {bubbles: true});
    this.dispatchEvent(event);
  }
}
${
  lang === 'js'
    ? `
customElements.define('${elementName}', ${className});`
    : ``
}`;
};
