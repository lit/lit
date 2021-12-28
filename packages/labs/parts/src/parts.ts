/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import {
  directive,
  Directive,
  DirectiveParameters,
  ElementPart,
} from 'lit/directive.js';
import {unsafeCSS, CSSResultGroup} from 'lit';

class CssPart extends Directive {
  render(_name: string | PartInfo) {}

  override update(part: ElementPart, [name]: DirectiveParameters<this>) {
    part.element.setAttribute('part', name as string);
  }
}

/**
 * Lit element part directive for specifying a css part specified via the
 * provided `define` API. Example:
 *
 * ```
 *   const parts = define(['header'], 'my-element');
 *   html`<div ${part(parts.header)}>Header</div>`
 * ```
 */
export const part = directive(CssPart);

/**
 * Adds a <style> to the main document using the provided template string.
 * The values of the string may be `PartInfo` objects. If so, their `css`
 * property is used, which provides a selector of the form `::part(name)`.
 * For example,
 *
 * ```
 * style`
 *   ${MyElement.parts.header} {
 *     font-size: 4rem;
 *   }
 * `;
 * ```
 */
export const createStyle = (
  strings: TemplateStringsArray,
  ...values: Array<string | PartInfo>
) => {
  const el = document.createElement('style');
  const css = strings.reduce((a, s, i) => {
    const v = values[i];
    const sel = v instanceof PartInfo ? v.css : v;
    return `${a}${s}${sel || ''}`;
  }, '');
  el.textContent = css;
  return el;
};

/**
 * Utility class for specifying css parts. Typically this is not used by itself,
 * but the parts produced by `define` are `PartInfo` objects.
 */
export class PartInfo {
  part: string;
  css: CSSResultGroup;
  def: CSSResultGroup;
  constructor(name: string, prefix = '', separator = '_') {
    this.part = `${prefix}${name && prefix ? separator : ''}${name}`;
    this.css = unsafeCSS(`::part(${this.part})`);
    this.def = unsafeCSS(`[part=${this.part}]`);
  }

  toString() {
    return this.part;
  }
}

/**
 * Type for an object with arbitrary keys, the values of which are `PartInfo`
 * objects. This is the return value of `define`.
 */
export type PartInfos = {[index: string]: PartInfo};

/**
 * Defines a set of css parts using the array of names and the given prefix.
 * If a prefix is provided, names are separated from it with a `_`.
 * Produces a `PartInfos` object with keys matching the given names and
 * `PartInfo` values that should be used to specify parts.
 */
export const define = (names: string[], prefix = '') => {
  const parts: PartInfos = {};
  names.forEach((n) => {
    parts[n] = new PartInfo(n, prefix);
  });
  return parts;
};
