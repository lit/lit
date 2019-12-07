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

let policy: Pick<TrustedTypePolicy, 'createHTML'>|undefined;

/**
 * Turns the value to trusted HTML. If the application uses Trusted Types the
 * value is transformed into TrustedHTML, which can be assigned to execution
 * sink. If the application doesn't use Trusted Types, the return value is the
 * same as the argument.
 */
function convertConstantTemplateStringToTrustedHTML(value: string): string|
    TrustedHTML {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any
  // TrustedTypes have been renamed to trustedTypes
  // (https://github.com/WICG/trusted-types/issues/177)
  const trustedTypes =
      (w.trustedTypes || w.TrustedTypes) as TrustedTypePolicyFactory;
  if (trustedTypes && !policy) {
    policy = trustedTypes.createPolicy('lit-html', {createHTML: (s) => s});
  }
  return policy ? policy.createHTML(value) : value;
}

const commentMarker = ` ${marker} `;

/**
 * Used to clone existing node instead of each time creating new one which is
 * slower
 */
const emptyTemplateNode = document.createElement('template');

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
    const template = emptyTemplateNode.cloneNode() as HTMLTemplateElement;
    // this is secure because `this.strings` is a TemplateStringsArray.
    // TODO: validate this when
    // https://github.com/tc39/proposal-array-is-template-object is implemented.
    template.innerHTML =
        convertConstantTemplateStringToTrustedHTML(this.getHTML()) as string;
    return template;
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
