/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
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

// Feature detection used to install creationScope in the renderOptions
const hasLegacyScopedCustomRegistry =
  'importNode' in ShadowRoot.prototype &&
  'createElement' in ShadowRoot.prototype &&
  !('initialize' in CustomElementRegistry.prototype);

// https://github.com/whatwg/html/issues/10854
// https://github.com/whatwg/html/pull/10869
const hasSpecCustomRegistry = 'customElements' in Element.prototype;
if (hasLegacyScopedCustomRegistry) {
  console.warn(
    'Old version of the scoped custom elements polyfill detected, please ' +
      'update. Support for this version will be removed in the future.'
  );
} else if (!hasSpecCustomRegistry) {
  console.warn(
    'Scoped registry mixin is not supported in this browser. ' +
      'Scoped custom elements will not work as expected.'
  );
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

    override createRenderRoot() {
      const constructor = this.constructor as typeof ScopedRegistryMixin &
        typeof LitElement;

      const {registry, elementDefinitions, shadowRootOptions} = constructor;

      if (elementDefinitions && !registry) {
        constructor.registry = new CustomElementRegistry();

        Object.entries(elementDefinitions).forEach(([tagName, klass]) =>
          constructor.registry!.define(tagName, klass)
        );
      }

      const renderRoot = this.attachShadow({
        ...shadowRootOptions,
        customElements: constructor.registry,
      });

      /**
       * Note, support for the initial spec proposal polyfill is maintained in
       * addition to the current spec proposal to facilitate element piecemeal
       * migration.
       *
       * When all elements are migrated to this version of the mixin, the
       * polyfill should be upgraded.
       */
      this.renderOptions.creationScope = hasLegacyScopedCustomRegistry
        ? renderRoot
        : {
            importNode(node: Node, deep?: boolean): Node {
              return document.importNode(node, {
                customElements: constructor.registry,
                selfOnly: !deep,
              } as unknown as boolean);
            },
          };

      adoptStyles(
        renderRoot,
        (this.constructor as typeof LitElement).elementStyles!
      );

      return renderRoot;
    }
  };
}
