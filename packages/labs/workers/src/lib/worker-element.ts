/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * @fileoverview
 *
 * This file contains the main thread half of the woker library.
 *
 * It exports `createWorkerElement()` which creates a local proxy to an element
 * that runs in a worker, and renders the worker element's DOM in its shadow
 * root.
 */

import {
  LitElement,
  adoptStyles,
  CSSResult,
  unsafeCSS,
  PropertyValues,
  render,
} from 'lit';
import {isTemplateResult} from 'lit/directive-helpers.js';
import type {Message, RenderMessage, StyleMessage} from './types';

const {hasOwn, defineProperty, getPrototypeOf, entries, fromEntries} = Object;

const templateStringsCache = new Map<number, TemplateStringsArray>();

const prepareResult = (v: unknown) => {
  if (isTemplateResult(v)) {
    // remote TemplateResults only has strings on first occurrence
    if (v.strings !== undefined) {
      templateStringsCache.set((v as unknown as {id: number}).id, v.strings);
      // Emulate a real TemplateStringsArray
      (v.strings as unknown as {raw: ReadonlyArray<string>}).raw = v.strings;
    } else {
      const strings = templateStringsCache.get(
        (v as unknown as {id: number}).id
      );
      if (strings === undefined) {
        throw new Error('strings not found');
      }
      v.strings = strings;
    }
  }
  return v;
};

export interface WorkerComponentOptions {
  tagName: string;
  url: string;
  attributes?: Array<string>;
}

/**
 * - TemplateResult: look up in cache
 * - Style: look up in cache
 * - Symbol: look up in cache
 */
// const prepareResponse = <T>(v: T) => v;

const styleCache = new Map<number, CSSResult>();
const getStyles = (styles: Array<StyleMessage>): Array<CSSResult> => {
  return styles.map((s) => {
    if (s.cssText !== undefined) {
      const cssResult = unsafeCSS(s.cssText);
      styleCache.set(s.id, cssResult);
      return cssResult;
    }
    const result = styleCache.get(s.id);
    if (result === undefined) {
      console.error(`Style ${s.id} not found`);
    }
    return result!;
  });
};

export const createWorkerElement = ({
  tagName,
  url,
  attributes,
}: WorkerComponentOptions): typeof LitElement => {
  const workerUrl = new URL('./worker.js', import.meta.url);
  class WorkerElement extends LitElement {
    #worker = new Worker(workerUrl, {type: 'module'});

    #styles?: Array<CSSResult>;

    #postMessage(message: Message) {
      this.#worker.postMessage(message);
    }

    #ready!: () => void;
    #initialized: Promise<void> | undefined = new Promise(
      (res) => (this.#ready = res)
    );

    #elementProperties = new Map();

    // We need to track attributes separately because we run attribute
    // converters in the worker
    #changedAttributes = new Map();

    static override get observedAttributes() {
      // trigger finialization
      super.observedAttributes;
      return attributes ?? [];
    }

    constructor() {
      super();
      // Get styles properties
      this.#postMessage({kind: 'initialize', url, tagName});
      this.#worker.addEventListener('message', ({data}: {data: Message}) => {
        const {kind} = data;
        if (kind === 'error') {
          console.error(data.errors);
        } else if (kind === 'initialize-reply') {
          console.log('initialize-reply', data);

          const prototype = getPrototypeOf(this);

          // Add styles
          this.#styles = getStyles(data.styles);

          // Add properties
          for (const [name, declaration] of entries(data.properties)) {
            // const {
            //   name,
            //   declaration,
            // }: {name: string; declaration: PropertyDeclaration} = p;
            const key = `__${name}`;

            this.#elementProperties.set(name, {});

            defineProperty(prototype, name, {
              get(this: WorkerElement) {
                return this[key as keyof WorkerElement];
              },
              set(this: WorkerElement, value: unknown) {
                const oldValue = this[name as keyof WorkerElement];
                (this as {} as {[key: string]: unknown})[key] = value;
                this.requestUpdate(name, oldValue, declaration);
              },
              configurable: true,
              enumerable: true,
            });

            // Replay the property through the setter
            if (hasOwn(this, name)) {
              const v = this[name as keyof this];
              delete this[name as keyof this];
              this[name as keyof this] = v;
            }
          }
          this.#ready();
          this.requestUpdate();
        } else if (kind === 'render-reply') {
          console.log('render-reply', data);
          // TODO: should we use the update lifecycle?
          render(prepareResult(data.result), this.shadowRoot!);
        }
      });
    }

    override attributeChangedCallback(
      name: string,
      old: string | null,
      _value: string | null
    ) {
      this.#changedAttributes.set(name, old);
      this.requestUpdate();
    }

    protected override createRenderRoot(): Element | ShadowRoot {
      const renderRoot = this.attachShadow(
        (this.constructor as typeof WorkerElement).shadowRootOptions
      );
      if (this.#styles !== undefined) {
        adoptStyles(renderRoot, this.#styles);
      }
      return renderRoot;
    }

    protected override async performUpdate() {
      console.log('local performUpdate');
      if (this.#initialized !== undefined) {
        await this.#initialized;
        this.#initialized = undefined;
      }
      // Send properties
      // eslint-disable-next-line
      const changedProperties = (this as any)
        ._$changedProperties as PropertyValues;
      console.log('elementProperties', this.#elementProperties);

      const currentValues = fromEntries(
        [...this.#elementProperties.keys()].map((k) => [
          k,
          this[k as keyof this],
        ])
      );

      const currentAttributes = fromEntries(
        [...this.#changedAttributes].map(([k]) => [k, this.getAttribute(k)])
      );

      this.#worker.postMessage({
        kind: 'render',
        changedProperties,
        currentValues,
        currentAttributes,
      } as RenderMessage);
    }
  }
  return WorkerElement;
};
