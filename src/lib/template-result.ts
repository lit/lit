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

/**
 * @module lit-html
 */

import {reparentNodes} from './dom.js';
import {TemplateProcessor} from './template-processor.js';
import {boundAttributeSuffix, lastAttributeNameRegex, marker, nodeMarker} from './template.js';

const commentMarker = ` ${marker} `;
// Number of 32 bit elements to use to create template digests
const digestSize = 2;

/**
 * The return type of `html`, which holds a Template and the values from
 * interpolated expressions.
 */
export class TemplateResult {
  readonly strings: TemplateStringsArray;
  readonly values: readonly unknown[];
  readonly type: string;
  readonly processor: TemplateProcessor;

  constructor(
      strings: TemplateStringsArray, values: readonly unknown[], type: string,
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
    let isCommentBinding = false;

    for (let i = 0; i < l; i++) {
      const s = this.strings[i];
      // For each binding we want to determine the kind of marker to insert
      // into the template source before it's parsed by the browser's HTML
      // parser. The marker type is based on whether the expression is in an
      // attribute, text, or comment position.
      //   * For node-position bindings we insert a comment with the marker
      //     sentinel as its text content, like <!--{{lit-guid}}-->.
      //   * For attribute bindings we insert just the marker sentinel for the
      //     first binding, so that we support unquoted attribute bindings.
      //     Subsequent bindings can use a comment marker because multi-binding
      //     attributes must be quoted.
      //   * For comment bindings we insert just the marker sentinel so we don't
      //     close the comment.
      //
      // The following code scans the template source, but is *not* an HTML
      // parser. We don't need to track the tree structure of the HTML, only
      // whether a binding is inside a comment, and if not, if it appears to be
      // the first binding in an attribute.
      const commentOpen = s.lastIndexOf('<!--');
      // We're in comment position if we have a comment open with no following
      // comment close. Because <-- can appear in an attribute value there can
      // be false positives.
      isCommentBinding = (commentOpen > -1 || isCommentBinding) &&
          s.indexOf('-->', commentOpen + 1) === -1;
      // Check to see if we have an attribute-like sequence preceding the
      // expression. This can match "name=value" like structures in text,
      // comments, and attribute values, so there can be false-positives.
      const attributeMatch = lastAttributeNameRegex.exec(s);
      if (attributeMatch === null) {
        // We're only in this branch if we don't have a attribute-like
        // preceding sequence. For comments, this guards against unusual
        // attribute values like <div foo="<!--${'bar'}">. Cases like
        // <!-- foo=${'bar'}--> are handled correctly in the attribute branch
        // below.
        html += s + (isCommentBinding ? commentMarker : nodeMarker);
      } else {
        // For attributes we use just a marker sentinel, and also append a
        // $lit$ suffix to the name to opt-out of attribute-specific parsing
        // that IE and Edge do for style and certain SVG attributes.
        html += s.substr(0, attributeMatch.index) + attributeMatch[1] +
            attributeMatch[2] + boundAttributeSuffix + attributeMatch[3] +
            marker;
      }
    }
    html += this.strings[l];
    return html;
  }

  getTemplateElement(): HTMLTemplateElement {
    const template = document.createElement('template');
    template.innerHTML = this.getHTML();
    return template;
  }

  // We need to specify a digest to use across rendering environments. This is a
  // simple digest build from a DJB2-ish hash modified from:
  // https://github.com/darkskyapp/string-hash/blob/master/index.js
  // It has been changed to an array of hashes to add additional bits.
  // Goals:
  //  - Extremely low collision rate. We may not be able to detect collisions.
  //  - Extremely fast.
  //  - Extremely small code size.
  //  - Safe to include in HTML comment text or attribute value.
  //  - Easily specifiable and implementable in multiple languages.
  // We don't care about cryptographic suitability.
  get digest() {
    const hashes = new Uint32Array(digestSize).fill(5381);

    for (const s of this.strings) {
      for (let i = 0; i < s.length; i++) {
        hashes[i % digestSize] =
            (hashes[i % digestSize] * 33) ^ s.charCodeAt(i);
      }
    }
    return btoa(String.fromCharCode(...new Uint8Array(hashes.buffer)));
  }
}

/**
 * A TemplateResult for SVG fragments.
 *
 * This class wraps HTML in an `<svg>` tag in order to parse its contents in the
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
