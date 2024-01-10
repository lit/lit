/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import ts from 'typescript';
import {LitTransformer} from './internal/lit-transformer.js';
import {CustomElementVisitor} from './internal/decorators/custom-element.js';
import {PropertyVisitor} from './internal/decorators/property.js';
import {StateVisitor} from './internal/decorators/state.js';
import {QueryVisitor} from './internal/decorators/query.js';
import {QueryAllVisitor} from './internal/decorators/query-all.js';
import {QueryAsyncVisitor} from './internal/decorators/query-async.js';
import {QueryAssignedElementsVisitor} from './internal/decorators/query-assigned-elements.js';
import {QueryAssignedNodesVisitor} from './internal/decorators/query-assigned-nodes.js';
import {EventOptionsVisitor} from './internal/decorators/event-options.js';
import {LocalizedVisitor} from './internal/decorators/localized.js';

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
 *     static properties = {
 *       name: {type: String}
 *     };
 *
 *     constructor() {
 *       super();
 *       this.name = 'Somebody';
 *     }
 *
 *     get button() {
 *       return this.renderRoot?.querySelector('#myButton') ?? null;
 *     }
 *   }
 *   customElements.define('simple-greeting', SimpleGreeting);
 */
export function idiomaticDecoratorsTransformer(
  program: ts.Program
): ts.TransformerFactory<ts.SourceFile> {
  return (context) => {
    const transformer = new LitTransformer(program, context, [
      new CustomElementVisitor(context),
      new PropertyVisitor(context),
      new StateVisitor(context),
      new QueryVisitor(context),
      new QueryAllVisitor(context),
      new QueryAsyncVisitor(context),
      new QueryAssignedElementsVisitor(context),
      new QueryAssignedNodesVisitor(context),
      new EventOptionsVisitor(context, program),
      new LocalizedVisitor(context),
    ]);
    return (file) => {
      return ts.visitNode(file, transformer.visitFile) as ts.SourceFile;
    };
  };
}
