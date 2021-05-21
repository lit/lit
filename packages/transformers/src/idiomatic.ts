/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as ts from 'typescript';

import {LitTransformer} from './lit-transformer.js';
import {CustomElementVisitor} from './idiomatic/custom-element.js';
import {PropertyVisitor} from './idiomatic/property.js';

/**
 * TypeScript transformer which transforms all Lit decorators to their idiomatic
 * JavaScript style.
 *
 * Example input:
 *
 *   import {LitElement} from 'lit';
 *   import {customElement, property, query} from 'lit/decorators.js';
 *
 *   @customElement('simple-greeting');
 *   class SimpleGreeting extends LitElement {
 *     @property({type: String})
 *     name = 'Somebody';
 *
 *     @query('#myButton');
 *     button;
 *   }
 *
 * Example output:
 *
 *   import {LitElement} from 'lit';
 *
 *   class SimpleGreeting extends LitElement {
 *     static get properties() {
 *       return {
 *         name: {type: String}
 *       };
 *     }
 *
 *     constructor() {
 *       super();
 *       this.name = 'Somebody';
 *     }
 *
 *     get button() {
 *       return this.renderRoot?.querySelector('#myButton');
 *     }
 *   }
 *   customElements.define('simple-greeting', SimpleGreeting);
 */
export default function idiomaticLitDecoratorTransformer(): ts.TransformerFactory<ts.SourceFile> {
  return (context) => {
    return (file) => {
      const transformer = new LitTransformer(context, [
        new CustomElementVisitor(context),
        new PropertyVisitor(context),
      ]);
      return ts.visitNode(file, transformer.visit);
    };
  };
}
