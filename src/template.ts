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

import {TemplatePart} from './template-part.js';
import {reparentNodes} from './nodes.js';

/**
 * An expression marker with embedded unique key to avoid
 * https://github.com/PolymerLabs/lit-html/issues/62
 */
const marker = `{{lit-${String(Math.random()).slice(2)}}}`;
const nodeMarker = `<!--${marker}-->`;
const markerRegex = new RegExp(`${marker}|${nodeMarker}`);

const nonWhitespace = /[^\s]/;

/**
 * This regex extracts the attribute name preceding an attribute-position
 * expression. It does this by matching the syntax allowed for attributes
 * against the string literal directly preceding the expression, assuming that
 * the expression is in an attribute-value position.
 *
 * See attributes in the HTML spec:
 * https://www.w3.org/TR/html5/syntax.html#attributes-0
 *
 * "\0-\x1F\x7F-\x9F" are Unicode control characters
 *
 * " \x09\x0a\x0c\x0d" are HTML space characters:
 * https://www.w3.org/TR/html5/infrastructure.html#space-character
 *
 * So an attribute is:
 *  * The name: any character except a control character, space character, ('),
 *    ("), ">", "=", or "/"
 *  * Followed by zero or more space characters
 *  * Followed by "="
 *  * Followed by zero or more space characters
 *  * Followed by:
 *    * Any character except space, ('), ("), "<", ">", "=", or
 *    * (") then any non-("), or
 *    * (') then any non-(')
 */
const lastAttributeNameRegex =
    /([^\0-\x1F\x7F-\x9F \x09\x0a\x0c\x0d"'>=/]+)[ \x09\x0a\x0c\x0d]*=[ \x09\x0a\x0c\x0d]*(?:[^ \x09\x0a\x0c\x0d"'`<>=]*|"[^"]*|'[^']*)$/;

/**
 * Finds the closing index of the last closed HTML tag.
 * This has 3 possible return values:
 *   - `-1`, meaning there is no tag in str.
 *   - `string.length`, meaning the last opened tag is unclosed.
 *   - Some positive number < str.length, meaning the index of the closing '>'.
 */
function findTagClose(str: string): number {
  const close = str.lastIndexOf('>');
  const open = str.indexOf('<', close + 1);
  return open > -1 ? str.length : close;
}

export class Template {
  parts: TemplatePart[] = [];
  element: HTMLTemplateElement;

  constructor(strings: TemplateStringsArray, svg: boolean = false) {
    const element = this.element = document.createElement('template');
    element.innerHTML = this._getHtml(strings, svg);
    const content = element.content;

    if (svg) {
      const svgElement = content.firstChild!;
      content.removeChild(svgElement);
      reparentNodes(content, svgElement.firstChild);
    }

    // Edge needs all 4 parameters present; IE11 needs 3rd parameter to be null
    const walker = document.createTreeWalker(
        content,
        133 /* NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT |
               NodeFilter.SHOW_TEXT */
        ,
        null as any,
        false);
    let index = -1;
    let partIndex = 0;
    const nodesToRemove: Node[] = [];

    // The actual previous node, accounting for removals: if a node is removed
    // it will never be the previousNode.
    let previousNode: Node|undefined;
    // Used to set previousNode at the top of the loop.
    let currentNode: Node|undefined;

    while (walker.nextNode()) {
      index++;
      previousNode = currentNode;
      const node = currentNode = walker.currentNode as Element;
      if (node.nodeType === 1 /* Node.ELEMENT_NODE */) {
        if (!node.hasAttributes()) {
          continue;
        }
        const attributes = node.attributes;
        // Per https://developer.mozilla.org/en-US/docs/Web/API/NamedNodeMap,
        // attributes are not guaranteed to be returned in document order. In
        // particular, Edge/IE can return them out of order, so we cannot assume
        // a correspondance between part index and attribute index.
        let count = 0;
        for (let i = 0; i < attributes.length; i++) {
          if (attributes[i].value.indexOf(marker) >= 0) {
            count++;
          }
        }
        while (count-- > 0) {
          // Get the template literal section leading up to the first
          // expression in this attribute attribute
          const stringForPart = strings[partIndex];
          // Find the attribute name
          const attributeNameInPart =
              lastAttributeNameRegex.exec(stringForPart)![1];
          // Find the corresponding attribute
          const attribute = attributes.getNamedItem(attributeNameInPart);
          const stringsForAttributeValue = attribute.value.split(markerRegex);
          this.parts.push(new TemplatePart(
              'attribute',
              index,
              attribute.name,
              attributeNameInPart,
              stringsForAttributeValue));
          node.removeAttribute(attribute.name);
          partIndex += stringsForAttributeValue.length - 1;
        }
      } else if (node.nodeType === 3 /* Node.TEXT_NODE */) {
        const nodeValue = node.nodeValue!;
        if (nodeValue.indexOf(marker) > -1) {
          const parent = node.parentNode!;
          const strings = nodeValue.split(markerRegex);
          const lastIndex = strings.length - 1;

          // We have a part for each match found
          partIndex += lastIndex;

          // We keep this current node, but reset its content to the last
          // literal part. We insert new literal nodes before this so that the
          // tree walker keeps its position correctly.
          node.textContent = strings[lastIndex];

          // Generate a new text node for each literal section
          // These nodes are also used as the markers for node parts
          for (let i = 0; i < lastIndex; i++) {
            parent.insertBefore(document.createTextNode(strings[i]), node);
            this.parts.push(new TemplatePart('node', index++));
          }
        } else {
          // Strip whitespace-only nodes, only between elements, or at the
          // beginning or end of elements.
          const previousSibling = node.previousSibling;
          const nextSibling = node.nextSibling;
          if ((previousSibling === null ||
               previousSibling.nodeType === 1 /* Node.ELEMENT_NODE */) &&
              (nextSibling === null ||
               nextSibling.nodeType === 1 /* Node.ELEMENT_NODE */) &&
              !nonWhitespace.test(nodeValue)) {
            nodesToRemove.push(node);
            currentNode = previousNode;
            index--;
          }
        }
      } else if (
          node.nodeType === 8 /* Node.COMMENT_NODE */ &&
          node.nodeValue === marker) {
        const parent = node.parentNode!;
        // Add a new marker node to be the startNode of the Part if any of the
        // following are true:
        //  * We don't have a previousSibling
        //  * previousSibling is being removed (thus it's not the
        //    `previousNode`)
        //  * previousSibling is not a Text node
        //
        // TODO(justinfagnani): We should be able to use the previousNode here
        // as the marker node and reduce the number of extra nodes we add to a
        // template. See https://github.com/PolymerLabs/lit-html/issues/147
        const previousSibling = node.previousSibling;
        if (previousSibling === null || previousSibling !== previousNode ||
            previousSibling.nodeType !== Node.TEXT_NODE) {
          parent.insertBefore(document.createTextNode(''), node);
        } else {
          index--;
        }
        this.parts.push(new TemplatePart('node', index++));
        nodesToRemove.push(node);
        // If we don't have a nextSibling add a marker node.
        // We don't have to check if the next node is going to be removed,
        // because that node will induce a new marker if so.
        if (node.nextSibling === null) {
          parent.insertBefore(document.createTextNode(''), node);
        } else {
          index--;
        }
        currentNode = previousNode;
        partIndex++;
      }
    }

    // Remove text binding nodes after the walk to not disturb the TreeWalker
    for (const n of nodesToRemove) {
      n.parentNode!.removeChild(n);
    }
  }

  /**
   * Returns a string of HTML used to create a <template> element.
   */
  private _getHtml(strings: TemplateStringsArray, svg?: boolean): string {
    const l = strings.length - 1;
    let html = '';
    let isTextBinding = true;
    for (let i = 0; i < l; i++) {
      const s = strings[i];
      html += s;
      // We're in a text position if the previous string closed its tags.
      // If it doesn't have any tags, then we use the previous text position
      // state.
      const closing = findTagClose(s);
      isTextBinding = closing > -1 ? closing < s.length : isTextBinding;
      html += isTextBinding ? nodeMarker : marker;
    }
    html += strings[l];
    return svg ? `<svg>${html}</svg>` : html;
  }
}
