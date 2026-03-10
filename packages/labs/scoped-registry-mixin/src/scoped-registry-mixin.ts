/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import type {LitElement} from 'lit';

// Proposed interface changes
declare global {
  interface CustomElementRegistry {
    initialize(root: Element | DocumentFragment): void;
  }
  interface ShadowRootInit {
    customElementRegistry?: CustomElementRegistry;
    // old property, retained for backwards compatibility
    customElements?: CustomElementRegistry;
  }
  interface ShadowRoot {
    customElementRegistry?: CustomElementRegistry;
    // old property, retained for backwards compatibility
    importNode(node: Node, deep?: boolean): Node;
  }
  interface Element {
    customElementRegistry?: CustomElementRegistry;
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
    protected static _elementDefinitions?: ElementDefinitionsMap;
    static registry?: CustomElementRegistry;

    protected static finalize() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (superclass as any).finalize.call(this);
      if (
        this.hasOwnProperty('elementDefinitions') &&
        !this.hasOwnProperty('_elementDefinitions')
      ) {
        this._elementDefinitions = {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...(this._elementDefinitions ?? {}),
          ...this.elementDefinitions,
        };
        this.registry = undefined;
      }
    }

    override attachShadow(init: ShadowRootInit) {
      const constructor = this.constructor as typeof ScopedRegistryMixin &
        typeof LitElement;
      // Detect supported API and supply expected property.
      // For backwards compatibility, use older property when:
      // (1) there is no native support (tested via
      // this.customElementRegistry === undefined), or
      // (2) when `importNode` is defined on ShadowRoot via an older polyfill
      // version.
      const useLegacyProperty =
        this.customElementRegistry === undefined ||
        'importNode' in ShadowRoot.prototype;
      const shadowRootInit = {...init};
      if (useLegacyProperty) {
        shadowRootInit.customElements = constructor.registry;
      } else {
        shadowRootInit.customElementRegistry = constructor.registry;
      }
      return super.attachShadow(shadowRootInit);
    }

    // Initializes registry if required. This is separate from attachShadow
    // to support DSD where LitELement won't call attachShadow.
    override createRenderRoot() {
      const constructor = this.constructor as typeof ScopedRegistryMixin &
        typeof LitElement;
      const {registry, _elementDefinitions} = constructor;
      if (_elementDefinitions && !registry) {
        constructor.registry = new CustomElementRegistry();
        Object.entries(_elementDefinitions).forEach(([tagName, klass]) =>
          constructor.registry!.define(tagName, klass)
        );
      }
      const root = super.createRenderRoot();
      if ((root as ShadowRoot | HTMLElement).customElementRegistry === null) {
        constructor.registry!.initialize?.(root);
      }
      return root;
    }
  };
}
