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
export declare type Constructor<T> = {
    new (...args: any[]): T;
};
export interface ClassDescriptor {
    kind: 'class';
    elements: ClassElement[];
    finisher?: <T>(clazz: Constructor<T>) => undefined | Constructor<T>;
}
export interface ClassElement {
    kind: 'field' | 'method';
    key: PropertyKey;
    placement: 'static' | 'prototype' | 'own';
    initializer?: Function;
    extras?: ClassElement[];
    finisher?: <T>(clazz: Constructor<T>) => undefined | Constructor<T>;
    descriptor?: PropertyDescriptor;
}
export declare const legacyPrototypeMethod: (descriptor: PropertyDescriptor, proto: Object, name: PropertyKey) => void;
export declare const standardPrototypeMethod: (descriptor: PropertyDescriptor, element: ClassElement) => {
    kind: string;
    placement: string;
    key: string | number | symbol;
    descriptor: PropertyDescriptor;
};
//# sourceMappingURL=base.d.ts.map