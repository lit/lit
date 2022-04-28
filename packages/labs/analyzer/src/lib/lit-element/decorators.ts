/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * @fileoverview
 *
 * Utilities for working with ReactiveElement decorators.
 */

import ts from 'typescript';

/**
 * Returns true if the decorator site is a simple called decorator factory of
 * the form `@decoratorName()`.
 *
 * TODO (justinfagnani): change to looking up decorators by known declarations.
 */
const isNamedDecoratorFactory = (
  decorator: ts.Decorator,
  name: string
): decorator is CustomElementDecorator =>
  ts.isCallExpression(decorator.expression) &&
  ts.isIdentifier(decorator.expression.expression) &&
  decorator.expression.expression.text === name;

export const isCustomElementDecorator = (
  decorator: ts.Decorator
): decorator is CustomElementDecorator =>
  isNamedDecoratorFactory(decorator, 'customElement');

/**
 * A narrower type for ts.Decorator that represents the shape of an analyzable
 * `@customElement('x')` callsite.
 */
interface CustomElementDecorator extends ts.Decorator {
  readonly expression: ts.CallExpression;
}

export const getPropertyDecorator = (declaration: ts.PropertyDeclaration) =>
  declaration.decorators?.find(isPropertyDecorator);

const isPropertyDecorator = (
  decorator: ts.Decorator
): decorator is PropertyDecorator =>
  isNamedDecoratorFactory(decorator, 'property');

/**
 * A narrower type for ts.Decorator that represents the shape of an analyzable
 * `@customElement('x')` callsite.
 */
interface PropertyDecorator extends ts.Decorator {
  readonly expression: ts.CallExpression;
}

/**
 * Gets the property options object from a `@property()` decorator callsite.
 *
 * Only works with an object literal passed as the first argument.
 */
export const getPropertyOptions = (decorator: PropertyDecorator) => {
  const options = decorator.expression.arguments[0];
  if (options !== undefined && ts.isObjectLiteralExpression(options)) {
    return options;
  }
  return undefined;
};
