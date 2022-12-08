/// <reference lib="dom" />

/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {escapeHtml} from './util/escape-html.js';
import type {RenderInfo} from './render-lit-html.js';
import type {RenderResult} from './render-result.js';

export type Constructor<T> = {new (): T};

export type ElementRendererConstructor = (new (
  tagName: string
) => ElementRenderer) &
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

export interface ShadowRootOptions {
  mode: 'open' | 'closed';
  delegatesFocus?: boolean;
}

/**
 * An object that renders elements of a certain type.
 */
export abstract class ElementRenderer {
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

  constructor(tagName: string) {
    this.tagName = tagName;
  }

  /**
   * Should implement server-appropriate implementation of connectedCallback
   */
  abstract connectedCallback(): void;

  /**
   * Should implement server-appropriate implementation of attributeChangedCallback
   */
  abstract attributeChangedCallback(
    name: string,
    old: string | null,
    value: string | null
  ): void;

  /**
   * Handles setting a property.
   *
   * Default implementation sets the property on the renderer's element instance.
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
    if (this.element !== undefined) {
      const old = this.element.getAttribute(name);
      this.element.setAttribute(name, value);
      this.attributeChangedCallback(name, old, value);
    }
  }

  /**
   * Override this getter to configure the element's shadow root, if one is
   * created with `renderShadow`.
   */
  get shadowRootOptions(): ShadowRootOptions {
    return {mode: 'open'};
  }

  /**
   * Render a single element's ShadowRoot children.
   */
  abstract renderShadow(_renderInfo: RenderInfo): RenderResult | undefined;

  /**
   * Render an element's light DOM children.
   */
  abstract renderLight(renderInfo: RenderInfo): RenderResult | undefined;

  /**
   * Render an element's attributes.
   *
   * Default implementation serializes all attributes on the element instance.
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
class FallbackRenderer extends ElementRenderer {
  private readonly _attributes: {[name: string]: string} = {};

  override setAttribute(name: string, value: string) {
    this._attributes[name] = value;
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

  connectedCallback() {}
  attributeChangedCallback() {}
  *renderLight() {}
  *renderShadow() {}
}
