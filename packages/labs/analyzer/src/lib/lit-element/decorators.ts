/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * @fileoverview
 *
 * Utilities for analyzing ReactiveElement decorators.
 */

import type ts from 'typescript';

export type TypeScript = typeof ts;

/**
 * Returns true if the decorator site is a simple called decorator factory of
 * the form `@decoratorName()`.
 *
 * TODO (justinfagnani): change to looking up decorators by known declarations.
 */
const isNamedDecoratorFactory = (
  ts: TypeScript,
  decorator: ts.Decorator,
  name: string
): decorator is CustomElementDecorator =>
  ts.isCallExpression(decorator.expression) &&
  ts.isIdentifier(decorator.expression.expression) &&
  decorator.expression.expression.text === name;

export const isCustomElementDecorator = (
  ts: TypeScript,
  decorator: ts.Decorator
): decorator is CustomElementDecorator =>
  isNamedDecoratorFactory(ts, decorator, 'customElement');

/**
 * A narrower type for ts.Decorator that represents the shape of an analyzable
 * `@customElement('x')` callsite.
 */
export interface CustomElementDecorator extends ts.Decorator {
  readonly expression: ts.CallExpression;
}

export const getPropertyDecorator = (
  ts: TypeScript,
  declaration: ts.PropertyDeclaration
) =>
  ts
    .getDecorators(declaration)
    ?.find((d): d is PropertyDecorator => isPropertyDecorator(ts, d));

const isPropertyDecorator = (
  ts: TypeScript,
  decorator: ts.Decorator
): decorator is PropertyDecorator =>
  isNamedDecoratorFactory(ts, decorator, 'property');

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
export const getPropertyOptions = (
  ts: TypeScript,
  decorator: PropertyDecorator
) => {
  const options = decorator.expression.arguments[0];
  if (options !== undefined && ts.isObjectLiteralExpression(options)) {
    return options;
  }
  return undefined;
};
