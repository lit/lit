/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import type {LitElement} from 'lit';

declare global {
  interface CustomElementRegistry {
    initialize(root: Element | DocumentFragment): void;
  }
  interface ShadowRootInit {
    customElementRegistry?: CustomElementRegistry;
    /** @deprecated No longer supported. Use `customElementRegistry` instead. */
    customElements?: CustomElementRegistry;
  }
  interface ShadowRoot {
    customElementRegistry?: CustomElementRegistry;
    /** @deprecated No longer supported. */
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
     * An object describing the scoped custom element registrations to make
     * for this class. They keys are the tag names to use for the definitions.
     */
    static elementDefinitions?: ElementDefinitionsMap;
    // Internal object describing registrations, including all superclass
    // defined elements. This is separate from `elementDefinitions` to avoid
    // modifying the user provided object.
    protected static _elementDefinitions?: ElementDefinitionsMap;
    static registry?: CustomElementRegistry;

    protected static finalize() {
      // Note, the `any` cast here is required because TypeScript doesn't
      // easily allow super calls to static methods.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (superclass as any).finalize.call(this);
      if (
        this.hasOwnProperty('elementDefinitions') &&
        !this.hasOwnProperty('_elementDefinitions')
      ) {
        this._elementDefinitions = {
          ...this._elementDefinitions,
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
