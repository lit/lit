/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import ts from 'typescript';
import {PropertyVisitor} from './property.js';

/**
 * Transform:
 *
 *   @state()
 *   foo
 *
 * Into:
 *
 *   static get properties() {
 *     return {
 *       foo: {state: true}
 *     }
 *   }
 */
export class StateVisitor extends PropertyVisitor {
  override readonly decoratorName = 'state';

  protected override _augmentOptions(
    options: ts.ObjectLiteralExpression
  ): ts.ObjectLiteralExpression {
    const factory = this._factory;
    return factory.createObjectLiteralExpression([
      ...(options !== undefined
        ? options.properties.filter((option) => {
            const name =
              option.name !== undefined && ts.isIdentifier(option.name)
                ? option.name.text
                : undefined;
            return name !== 'state';
          })
        : []),
      factory.createPropertyAssignment(
        factory.createIdentifier('state'),
        factory.createTrue()
      ),
    ]);
  }
}
