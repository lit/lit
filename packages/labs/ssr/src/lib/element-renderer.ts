/// <reference lib="dom" />

/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

export type Constructor<T> = {new (): T};

import {createRequire} from 'module';
const require = createRequire(import.meta.url);

// eslint-disable-next-line @typescript-eslint/no-var-requires
const escapeHtml = require('escape-html') as typeof import('escape-html');

import {RenderInfo} from './render-lit-html.js';

export type ConcreteElementRenderer = (new (
  tagName: string
) => ElementRenderer) &
  typeof ElementRenderer;

type StaticAttributes = Map<string, string>;

const rendererForPrototype: Map<
  HTMLElement,
  ConcreteElementRenderer
> = new Map();

const getRendererClass = (
  renderers: ConcreteElementRenderer[],
  tagName: string,
  ceClass: typeof HTMLElement = customElements.get(tagName),
  staticAttributes: StaticAttributes = new Map()
): ConcreteElementRenderer | null | undefined => {
  if (ceClass === undefined) {
    console.warn(`Custom element ${tagName} was not registered.`);
    return;
  }
  // Two-level lookup: first lookup CE base class if we've found it before,
  // otherwise iterate all the renderer matchers. Using the ceClass's base
  // class rather than ceClass makes an assumption about renderers being
  // written for base classes that are extended, but this is an optimization
  const ceBaseClassProto = Object.getPrototypeOf(ceClass).prototype;
  let elementRenderer = rendererForPrototype.get(ceBaseClassProto);
  if (elementRenderer === undefined) {
    for (const renderer of renderers) {
      if (renderer.matchesClass(ceClass, tagName)) {
        elementRenderer = renderer;
        rendererForPrototype.set(ceBaseClassProto, elementRenderer);
        break;
      }
    }
  }
  // Note that returning `null` is distinct from `undefined`: null means
  // is interpreted as a match but "do not render", whereas
  if (elementRenderer === undefined) {
    console.error(`No renderer for custom element: ${tagName}`);
    return;
  }

  return elementRenderer.matchesInstance(ceClass, tagName, staticAttributes)
    ? elementRenderer
    : undefined;
};

export const getElementRenderer = (
  renderInfo: RenderInfo,
  tagName: string,
  ceClass: typeof HTMLElement = customElements.get(tagName),
  staticAttributes: StaticAttributes
): ElementRenderer | undefined => {
  const renderer = getRendererClass(
    renderInfo.elementRenderers,
    tagName,
    ceClass,
    staticAttributes
  );
  return renderer ? new renderer(tagName) : undefined;
};
/**
 * An object that renders elements of a certain type.
 */
export abstract class ElementRenderer {
  element!: HTMLElement;
  tagName: string;

  static matchesClass(_ceClass: typeof HTMLElement, _tagName: string) {
    return false;
  }

  static matchesInstance(
    _ceClass: typeof HTMLElement,
    _tagName: string,
    _staticAttributes: StaticAttributes
  ) {
    return true;
  }

  constructor(tagName: string) {
    this.tagName = tagName;
    try {
      this.element = new (customElements.get(this.tagName))();
    } catch (e) {
      console.error(`Exception in custom element constructor ${e}`);
      return;
    }
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.element as any)[name] = value;
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
    const old = this.element.getAttribute(name);
    this.element.setAttribute(name, value);
    this.attributeChangedCallback(name, old, value);
  }

  /**
   * Render a single element's ShadowRoot children.
   */
  abstract renderShadow(_renderInfo: RenderInfo): IterableIterator<string>;

  /**
   * Render an element's light DOM children.
   */
  abstract renderLight(renderInfo: RenderInfo): IterableIterator<string>;

  /**
   * Render an element's attributes.
   *
   * Default implementation serializes all attributes on the element instance.
   */
  *renderAttributes(): IterableIterator<string> {
    const {attributes} = this.element;
    for (
      let i = 0, name, value;
      i < attributes.length && ({name, value} = attributes[i]);
      i++
    ) {
      if (value === '') {
        yield ` ${name}`;
      } else {
        yield ` ${name}="${escapeHtml(value)}"`;
      }
    }
  }
}
