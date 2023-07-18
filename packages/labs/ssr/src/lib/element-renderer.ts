/// <reference lib="dom" />

/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {escapeHtml} from './util/escape-html.js';
import type {RenderInfo} from './render-value.js';
import type {RenderResult} from './render-result.js';

type Interface<T> = {
  [P in keyof T]: T[P];
};

export type ElementRendererConstructor = (new (
  tagName: string
) => Interface<ElementRenderer>) &
  typeof ElementRenderer;

type AttributesMap = Map<string, string>;

export const getElementRenderer = (
  {elementRenderers}: RenderInfo,
  tagName: string,
  ceClass: typeof HTMLElement | undefined = customElements.get(tagName),
  attributes: AttributesMap = new Map()
): ElementRenderer => {
  if (ceClass === undefined) {
    console.warn(`Custom element ${tagName} was not registered.`);
    return new FallbackRenderer(tagName);
  }
  // TODO(kschaaf): Should we implement a caching scheme, e.g. keyed off of
  // ceClass's base class to prevent O(n) lookups for every element (probably
  // not a concern for the small number of element renderers we'd expect)? Doing
  // so would preclude having cross-cutting renderers to e.g. no-op render all
  // custom elements with a `client-only` attribute, so punting for now.
  for (const renderer of elementRenderers) {
    if (renderer.matchesClass(ceClass, tagName, attributes)) {
      return new renderer(tagName);
    }
  }
  return new FallbackRenderer(tagName);
};

// TODO (justinfagnani): remove in favor of ShadowRootInit
/**
 * @deprecated Use ShadowRootInit instead
 */
export type ShadowRootOptions = ShadowRootInit;

/**
 * An object that renders elements of a certain type.
 */
export abstract class ElementRenderer {
  // TODO (justinfagnani): We shouldn't assume that ElementRenderer subclasses
  // create an element instance. Move this to a base class for renderers that
  // do.
  element?: HTMLElement;
  tagName: string;

  /**
   * Should be implemented to return true when the given custom element class
   * and/or tagName should be handled by this renderer.
   *
   * @param ceClass - Custom Element class
   * @param tagName - Tag name of custom element instance
   * @param attributes - Map of attribute key/value pairs
   * @returns
   */
  static matchesClass(
    _ceClass: typeof HTMLElement,
    _tagName: string,
    _attributes: AttributesMap
  ) {
    return false;
  }

  /**
   * Called when a custom element is instantiated during a server render.
   *
   * An ElementRenderer can actually instantiate the custom element class, or
   * it could emulate the element in some other way.
   */
  constructor(tagName: string) {
    this.tagName = tagName;
  }

  /**
   * Called when a custom element is "attached" to the server DOM.
   *
   * Because we don't presume a full DOM emulation, this isn't the same as
   * being connected in a real browser. There may not be an owner document,
   * parentNode, etc., depending on the DOM emulation.
   *
   * If this renderer is creating actual element instances, it may forward
   * the call to the element's `connectedCallback()`.
   *
   * The default impementation is a no-op.
   */
  connectedCallback(): void {
    // do nothing
  }

  /**
   * Called from `setAttribute()` to emulate the browser's
   * `attributeChangedCallback` lifecycle hook.
   *
   * If this renderer is creating actual element instances, it may forward
   * the call to the element's `attributeChangedCallback()`.
   */
  attributeChangedCallback(
    _name: string,
    _old: string | null,
    _value: string | null
  ) {
    // do nothing
  }

  /**
   * Handles setting a property on the element.
   *
   * The default implementation sets the property on the renderer's element
   * instance.
   *
   * @param name Name of the property
   * @param value Value of the property
   */
  setProperty(name: string, value: unknown) {
    if (this.element !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this.element as any)[name] = value;
    }
  }

  /**
   * Handles setting an attribute on an element.
   *
   * Default implementation calls `setAttribute` on the renderer's element
   * instance, and calls the abstract `attributeChangedCallback` on the
   * renderer.
   *
   * @param name Name of the attribute
   * @param value Value of the attribute
   */
  setAttribute(name: string, value: string) {
    // Browser turns all HTML attributes to lowercase.
    name = name.toLowerCase();
    if (this.element !== undefined) {
      const old = this.element.getAttribute(name);
      this.element.setAttribute(name, value);
      this.attributeChangedCallback(name, old, value);
    }
  }

  /**
   * The shadow root options to write to the declarative shadow DOM <template>,
   * if one is created with `renderShadow()`.
   */
  get shadowRootOptions(): ShadowRootInit {
    return {mode: 'open'};
  }

  /**
   * Render the element's shadow root children.
   *
   * If `renderShadow()` returns undefined, no declarative shadow root is
   * emitted.
   */
  renderShadow(_renderInfo: RenderInfo): RenderResult | undefined {
    return undefined;
  }

  /**
   * Render the element's light DOM children.
   */
  renderLight(_renderInfo: RenderInfo): RenderResult | undefined {
    return undefined;
  }

  /**
   * Render the element's attributes.
   *
   * The default implementation serializes all attributes on the element
   * instance.
   */
  *renderAttributes(): RenderResult {
    if (this.element !== undefined) {
      const {attributes} = this.element;
      for (
        let i = 0, name, value;
        i < attributes.length && ({name, value} = attributes[i]);
        i++
      ) {
        if (value === '' || value === undefined || value === null) {
          yield ` ${name}`;
        } else {
          yield ` ${name}="${escapeHtml(value)}"`;
        }
      }
    }
  }
}

/**
 * An ElementRenderer used as a fallback in the case where a custom element is
 * either unregistered or has no other matching renderer.
 */
export class FallbackRenderer extends ElementRenderer {
  private readonly _attributes: {[name: string]: string} = {};

  override setAttribute(name: string, value: string) {
    // Browser turns all HTML attributes to lowercase.
    this._attributes[name.toLowerCase()] = value;
  }

  override *renderAttributes(): RenderResult {
    for (const [name, value] of Object.entries(this._attributes)) {
      if (value === '' || value === undefined || value === null) {
        yield ` ${name}`;
      } else {
        yield ` ${name}="${escapeHtml(value)}"`;
      }
    }
  }
}
