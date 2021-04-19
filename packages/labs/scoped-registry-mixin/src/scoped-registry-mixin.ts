/**
 * @license
 * Copyright (c) 2021 The Polymer Project Authors. All rights reserved.
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

import type {LitElement} from 'lit';
import {adoptStyles} from '@lit/reactive-element/css-tag.js';

// Proposed interface changes
declare global {
  interface ShadowRootInit {
    customElements?: CustomElementRegistry;
  }
  interface ShadowRoot {
    importNode(node: Node, deep?: boolean): Node;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LitElementConstructor = new (...args: any[]) => LitElement;

export type ElementDefinitionsMap = {
  [key: string]: typeof HTMLElement;
};

export function ScopedRegistryHost<SuperClass extends LitElementConstructor>(
  superclass: SuperClass
): SuperClass {
  return class ScopedRegistryMixin extends superclass {
    /**
     * Obtains the scoped elements definitions map
     */
    static elementDefinitions?: ElementDefinitionsMap;
    static registry?: CustomElementRegistry;

    createRenderRoot() {
      const constructor = this.constructor as typeof ScopedRegistryMixin &
        typeof LitElement;

      const {registry, elementDefinitions, shadowRootOptions} = constructor;

      if (elementDefinitions && !registry) {
        constructor.registry = new CustomElementRegistry();

        Object.entries(elementDefinitions).forEach(([tagName, klass]) =>
          constructor.registry!.define(tagName, klass)
        );
      }

      const renderRoot = (this.renderOptions.creationScope = this.attachShadow({
        ...shadowRootOptions,
        customElements: constructor.registry,
      }));

      adoptStyles(
        renderRoot,
        (this.constructor as typeof LitElement).elementStyles!
      );

      return renderRoot;
    }
  };
}
