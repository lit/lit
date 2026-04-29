/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {QueryAssignedElementsVisitor} from './query-assigned-elements.js';

/**
 * Transform:
 *
 *   @queryAssignedNodes({slot: 'list'})
 *   listItems
 *
 * Into:
 *
 *   get listItems() {
 *     return this.renderRoot
 *       ?.querySelector('slot[name=list]')
 *       ?.assignedNodes() ?? [];
 *   }
 */
export class QueryAssignedNodesVisitor extends QueryAssignedElementsVisitor {
  override readonly decoratorName = 'queryAssignedNodes';
  override slottedQuery = 'assignedNodes';
}
