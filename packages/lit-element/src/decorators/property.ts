/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

/*
 * IMPORTANT: For compatibility with tsickle and the Closure JS compiler, all
 * property decorators (but not class decorators) in this file that have
 * an @ExportDecoratedItems annotation must be defined as a regular function,
 * not an arrow function.
 */
import {PropertyDeclaration, UpdatingElement} from '../updating-element.js';
import {ClassElement} from './base.js';

const standardProperty = (
  options: PropertyDeclaration,
  element: ClassElement
) => {
  // When decorating an accessor, pass it through and add property metadata.
  // Note, the `hasOwnProperty` check in `createProperty` ensures we don't
  // stomp over the user's accessor.
  if (
    element.kind === 'method' &&
    element.descriptor &&
    !('value' in element.descriptor)
  ) {
    return {
      ...element,
      finisher(clazz: typeof UpdatingElement) {
        clazz.createProperty(element.key, options);
      },
    };
  } else {
    // createProperty() takes care of defining the property, but we still
    // must return some kind of descriptor, so return a descriptor for an
    // unused prototype field. The finisher calls createProperty().
    return {
      kind: 'field',
      key: Symbol(),
      placement: 'own',
      descriptor: {},
      // When @babel/plugin-proposal-decorators implements initializers,
      // do this instead of the initializer below. See:
      // https://github.com/babel/babel/issues/9260 extras: [
      //   {
      //     kind: 'initializer',
      //     placement: 'own',
      //     initializer: descriptor.initializer,
      //   }
      // ],
      initializer(this: {[key: string]: unknown}) {
        if (typeof element.initializer === 'function') {
          this[element.key as string] = element.initializer.call(this);
        }
      },
      finisher(clazz: typeof UpdatingElement) {
        clazz.createProperty(element.key, options);
      },
    };
  }
};

const legacyProperty = (
  options: PropertyDeclaration,
  proto: Object,
  name: PropertyKey
) => {
  (proto.constructor as typeof UpdatingElement).createProperty(name, options);
};

/**
 * A property decorator which creates a LitElement property which reflects a
 * corresponding attribute value. A [[`PropertyDeclaration`]] may optionally be
 * supplied to configure property features.
 *
 * This decorator should only be used for public fields. Private or protected
 * fields should use the [[`internalProperty`]] decorator.
 *
 * @example
 * ```ts
 * class MyElement {
 *   @property({ type: Boolean })
 *   clicked = false;
 * }
 * ```
 * @category Decorator
 * @ExportDecoratedItems
 */
export function property(options?: PropertyDeclaration) {
  // tslint:disable-next-line:no-any decorator
  return (protoOrDescriptor: Object | ClassElement, name?: PropertyKey): any =>
    name !== undefined
      ? legacyProperty(options!, protoOrDescriptor as Object, name)
      : standardProperty(options!, protoOrDescriptor as ClassElement);
}
