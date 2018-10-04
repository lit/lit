/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
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

import {reparentNodes} from './dom.js';
import {TemplateProcessor} from './template-processor.js';
import {lastAttributeNameRegex, marker, nodeMarker, rewritesStyleAttribute} from './template.js';

/**
 * The return type of `html`, which holds a Template and the values from
 * interpolated expressions.
 */
export class TemplateResult {
  strings: TemplateStringsArray;
  values: any[];
  type: string;
  processor: TemplateProcessor;

  constructor(
      strings: TemplateStringsArray, values: any[], type: string,
      processor: TemplateProcessor) {
    this.strings = strings;
    this.values = values;
    this.type = type;
    this.processor = processor;
  }

  /**
   * Returns a string of HTML used to create a `<template>` element.
   */
  getHTML(): string {
    const l = this.strings.length - 1;
    let html = '';
    let isTextBinding = true;
    for (let i = 0; i < l; i++) {
      const s = this.strings[i];
      html += s;
      const close = s.lastIndexOf('>');
      // We're in a text position if the previous string closed its last tag, an
      // attribute position if the string opened an unclosed tag, and unchanged
      // if the string had no brackets at all:
      //
      // "...>...": text position. open === -1, close > -1
      // "...<...": attribute position. open > -1
      // "...": no change. open === -1, close === -1
      isTextBinding =
          (close > -1 || isTextBinding) && s.indexOf('<', close + 1) === -1;

      if (!isTextBinding && rewritesStyleAttribute) {
        html = html.replace(lastAttributeNameRegex, (match, p1, p2, p3) => {
          return (p2 === 'style') ? `${p1}style$${p3}` : match;
        });
      }
      html += isTextBinding ? nodeMarker : marker;
    }
    html += this.strings[l];
    return html;
  }

  getTemplateElement(): HTMLTemplateElement {
    const template = document.createElement('template');
    template.innerHTML = this.getHTML();
    return template;
  }
}

/**
 * A TemplateResult for SVG fragments.
 *
 * This class wraps HTMl in an `<svg>` tag in order to parse its contents in the
 * SVG namespace, then modifies the template to remove the `<svg>` tag so that
 * clones only container the original fragment.
 */
export class SVGTemplateResult extends TemplateResult {
  getHTML(): string {
    return `<svg>${super.getHTML()}</svg>`;
  }

  getTemplateElement(): HTMLTemplateElement {
    const template = super.getTemplateElement();
    const content = template.content;
    const svgElement = content.firstChild!;
    content.removeChild(svgElement);
    reparentNodes(content, svgElement.firstChild);
    return template;
  }
}
