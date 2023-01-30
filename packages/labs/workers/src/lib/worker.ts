/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

// Must be imported first to install the DOM shim
import './install-dom-shim.js';

import {
  CSSResult,
  CSSResultOrNative,
  LitElement,
  PropertyValues,
  ReactiveElement,
} from 'lit';
import {isTemplateResult} from 'lit/directive-helpers.js';
import type {
  InitializeReplyMessage,
  Message,
  RenderReplyMessage,
  StyleMessage,
} from './types';

/**
 * @fileoverview
 *
 * This file container the worker thread half of the worker library.
 */

interface PublicUpdate {
  update(changedProperties: PropertyValues): void;
}

// Patch LitElement.update in order to capture the return value of
// render() to send to the main thread
// eslint-disable-next-line
(LitElement.prototype as unknown as PublicUpdate).update = function (
  this: LitElement,
  changedProperties: PropertyValues
) {
  console.log('worker update');
  const result = this.render();
  // emulate super.update(changedProperties)
  // We need to do this to make the element as updated
  (ReactiveElement.prototype as unknown as PublicUpdate).update.call(
    this,
    changedProperties
  );
  postMessage({
    kind: 'render-reply',
    result: prepareResult(result),
  } as RenderReplyMessage);
};

let instance: LitElement;

const styleCache = new Map<CSSResult, number>();
let nextStyleId = 1;

const templateIdCache = new Map<TemplateStringsArray, number>();
let nextTemplateResultId = 1;

/**
 * Recursively translates a render result to be sent via postMessage()
 *
 * If `v` is a TemplateResult, generates a unique stable ID based on its
 * .string TemplateStringsArray so that template identity can be represented
 * across worker boundaries.
 */
const prepareResult = (v: unknown) => {
  if (isTemplateResult(v)) {
    let id = templateIdCache.get(v.strings);
    if (id === undefined) {
      templateIdCache.set(v.strings, (id = nextTemplateResultId++));
    }
    // eslint-disable-next-line
    (v as any).id = id;
  }
  return v;
};

self.addEventListener('message', async ({data}: {data: Message}) => {
  const {kind} = data;
  if (kind === 'initialize') {
    const {tagName, url} = data;
    await import(url);
    const elementClass = customElements.get(tagName);
    if (elementClass === undefined) {
      postMessage({
        kind: 'initialize-reply',
        status: 'error',
        errors: [`tagName ${tagName} not defined`],
      });
      return;
    }
    const el = new elementClass();
    if (!(el instanceof LitElement)) {
      postMessage({
        kind: 'error',
        errors: [`tagName ${tagName} is not a LitElement`],
      });
      return;
    }
    instance = el;

    // Collect styles
    let styles: Array<StyleMessage> = [];
    const rawStyles = (el.constructor as typeof LitElement).styles;
    if (rawStyles !== undefined) {
      const flatStyles = [rawStyles].flat(10) as Array<CSSResultOrNative>;
      styles = flatStyles.map((s) => {
        if (s instanceof CSSStyleSheet) {
          throw new Error('Native CSSStyleSheet not supported yet');
        }
        let id = styleCache.get(s);
        let cssText: string | undefined = undefined;
        if (id === undefined) {
          styleCache.set(s, (id = nextStyleId++));
          // The first time we send the style, include the text
          cssText = s.cssText;
        }
        return {
          id,
          cssText,
        };
      });
    }

    // Collect properties
    const elementProperties = (el.constructor as typeof LitElement)
      .elementProperties;
    const properties = Object.fromEntries(
      [...elementProperties].map(([k, v]) => [
        k,
        {attribute: v.attribute, reflect: v.reflect},
      ])
    );

    // Needed to enable updates and run controllers
    instance.connectedCallback();

    const replyMessage: InitializeReplyMessage = {
      kind: 'initialize-reply',
      styles,
      properties,
    };
    console.log('initialize-reply', replyMessage);
    postMessage(replyMessage);
    return;
  } else if (kind === 'render') {
    const {currentValues, currentAttributes} = data;
    console.log('render message', data);

    // Set the properties
    Object.assign(instance, currentValues);

    // Set the attributes
    for (const [name, value] of Object.entries(currentAttributes)) {
      instance.setAttribute(name, value);
      instance.attributeChangedCallback(name, '', value);
    }
    instance.requestUpdate();
    await instance.updateComplete;
    console.log('render done?');
  }
});
