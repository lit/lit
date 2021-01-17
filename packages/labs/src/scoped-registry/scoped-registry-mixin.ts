/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
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

import {LitElement} from 'lit-element';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LitElementConstructor = new (...args: any[]) => LitElement;

export type ScopedElementsMap = {
  [key: string]: typeof HTMLElement;
};

export function UseScopedRegistry<SuperClass extends LitElementConstructor>(
  superclass: SuperClass
): SuperClass {
  return class ScopedRegistryMixin extends superclass {
    /**
     * Obtains the scoped elements definitions map
     */
    static scopedElements?: ScopedElementsMap;
    static registry?: CustomElementRegistry;

    createRenderRoot() {
      const constructor = this.constructor as typeof ScopedRegistryMixin;
      // @ts-expect-error: customElements not yet in ShadowRootInit type
      const { registry, scopedElements, shadowRootOptions } = constructor;

      if (scopedElements && !registry) {
        constructor.registry = new CustomElementRegistry();

        Object.entries(scopedElements).forEach(([tagName, klass]) =>
          constructor.registry?.define(tagName, klass)
        );
      }

      return this.renderOptions.ownerRoot = this.attachShadow({
        ...shadowRootOptions,
        customElements: constructor.registry,
      });
    }
  };
}
