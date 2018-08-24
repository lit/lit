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

import {TemplateResult} from './template-result.js';

/**
 * An expression marker with embedded unique key to avoid collision with
 * possible text in templates.
 */
export const marker = `{{lit-${String(Math.random()).slice(2)}}}`;

/**
 * An expression marker used text-positions, not attribute positions,
 * in template.
 */
export const nodeMarker = `<!--${marker}-->`;

export const markerRegex = new RegExp(`${marker}|${nodeMarker}`);

export const rewritesStyleAttribute = (() => {
  const el = document.createElement('div');
  el.setAttribute('style', '{{bad value}}');
  return el.getAttribute('style') !== '{{bad value}}';
})();

/**
 * An updateable Template that tracks the location of dynamic parts.
 */
export class Template {
  parts: TemplatePart[] = [];
  element: HTMLTemplateElement;

  constructor(result: TemplateResult, element: HTMLTemplateElement) {
    this.element = element;
    let index = -1;
    let partIndex = 0;
    const nodesToRemove: Node[] = [];
    const _prepareTemplate = (template: HTMLTemplateElement) => {
      const content = template.content;
      // Edge needs all 4 parameters present; IE11 needs 3rd parameter to be
      // null
      const walker = document.createTreeWalker(
          content,
          133 /* NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT |
                 NodeFilter.SHOW_TEXT */
          ,
          null as any,
          false);
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
          if (node.hasAttributes()) {
            const attributes = node.attributes;
            // Per
            // https://developer.mozilla.org/en-US/docs/Web/API/NamedNodeMap,
            // attributes are not guaranteed to be returned in document order.
            // In particular, Edge/IE can return them out of order, so we cannot
            // assume a correspondance between part index and attribute index.
            let count = 0;
            for (let i = 0; i < attributes.length; i++) {
              if (attributes[i].value.indexOf(marker) >= 0) {
                count++;
              }
            }
            while (count-- > 0) {
              // Get the template literal section leading up to the first
              // expression in this attribute
              const stringForPart = result.strings[partIndex];
              // Find the attribute name
              const name = lastAttributeNameRegex.exec(stringForPart)![2];
              // Find the corresponding attribute
              // If the attribute name contains special characters, lower-case
              // it so that on XML nodes with case-sensitive getAttribute() we
              // can still find the attribute, which will have been lower-cased
              // by the parser.
              //
              // If the attribute name doesn't contain special character, it's
              // important to _not_ lower-case it, in case the name is
              // case-sensitive, like with XML attributes like "viewBox".
              const attributeLookupName =
                  (rewritesStyleAttribute && name === 'style') ?
                  'style$' :
                  /^[a-zA-Z-]*$/.test(name) ? name : name.toLowerCase();
              const attributeValue = node.getAttribute(attributeLookupName)!;
              const strings = attributeValue.split(markerRegex);
              this.parts.push({type: 'attribute', index, name, strings});
              node.removeAttribute(attributeLookupName);
              partIndex += strings.length - 1;
            }
          }
          if (node.tagName === 'TEMPLATE') {
            _prepareTemplate(node as HTMLTemplateElement);
          }
        } else if (node.nodeType === 3 /* Node.TEXT_NODE */) {
          const nodeValue = node.nodeValue!;
          if (nodeValue.indexOf(marker) < 0) {
            continue;
          }
          const parent = node.parentNode!;
          const strings = nodeValue.split(markerRegex);
          const lastIndex = strings.length - 1;
          // We have a part for each match found
          partIndex += lastIndex;
          // Generate a new text node for each literal section
          // These nodes are also used as the markers for node parts
          for (let i = 0; i < lastIndex; i++) {
            parent.insertBefore(
                (strings[i] === '') ? createMarker() :
                                      document.createTextNode(strings[i]),
                node);
            this.parts.push({type: 'node', index: index++});
          }
          parent.insertBefore(
              strings[lastIndex] === '' ?
                  createMarker() :
                  document.createTextNode(strings[lastIndex]),
              node);
          nodesToRemove.push(node);
        } else if (node.nodeType === 8 /* Node.COMMENT_NODE */) {
          if (node.nodeValue === marker) {
            const parent = node.parentNode!;
            // Add a new marker node to be the startNode of the Part if any of
            // the following are true:
            //  * We don't have a previousSibling
            //  * previousSibling is being removed (thus it's not the
            //    `previousNode`)
            //  * previousSibling is not a Text node
            //
            // TODO(justinfagnani): We should be able to use the previousNode
            // here as the marker node and reduce the number of extra nodes we
            // add to a template. See
            // https://github.com/PolymerLabs/lit-html/issues/147
            const previousSibling = node.previousSibling;
            if (previousSibling === null || previousSibling !== previousNode ||
                previousSibling.nodeType !== Node.TEXT_NODE) {
              parent.insertBefore(createMarker(), node);
            } else {
              index--;
            }
            this.parts.push({type: 'node', index: index++});
            nodesToRemove.push(node);
            // If we don't have a nextSibling add a marker node.
            // We don't have to check if the next node is going to be removed,
            // because that node will induce a new marker if so.
            if (node.nextSibling === null) {
              parent.insertBefore(createMarker(), node);
            } else {
              index--;
            }
            currentNode = previousNode;
            partIndex++;
          } else {
            let i = -1;
            while ((i = node.nodeValue!.indexOf(marker, i + 1)) !== -1) {
              // Comment node has a binding marker inside, make an inactive part
              // The binding won't work, but subsequent bindings will
              // TODO (justinfagnani): consider whether it's even worth it to
              // make bindings in comments work
              this.parts.push({type: 'node', index: -1});
            }
          }
        }
      }
    };
    _prepareTemplate(element);
    // Remove text binding nodes after the walk to not disturb the TreeWalker
    for (const n of nodesToRemove) {
      n.parentNode!.removeChild(n);
    }
  }
}

/**
 * A placeholder for a dynamic expression in an HTML template.
 *
 * There are two built-in part types: AttributePart and NodePart. NodeParts
 * always represent a single dynamic expression, while AttributeParts may
 * represent as many expressions are contained in the attribute.
 *
 * A Template's parts are mutable, so parts can be replaced or modified
 * (possibly to implement different template semantics). The contract is that
 * parts can only be replaced, not removed, added or reordered, and parts must
 * always consume the correct number of values in their `update()` method.
 *
 * TODO(justinfagnani): That requirement is a little fragile. A
 * TemplateInstance could instead be more careful about which values it gives
 * to Part.update().
 */
export type TemplatePart = {
  type: 'node',
  index: number
}|{type: 'attribute', index: number, name: string, strings: string[]};

export const isTemplatePartActive = (part: TemplatePart) => part.index !== -1;

// Allows `document.createComment('')` to be renamed for a
// small manual size-savings.
export const createMarker = () => document.createComment('');

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
 *    * Any character except space, ('), ("), "<", ">", "=", (`), or
 *    * (") then any non-("), or
 *    * (') then any non-(')
 */
export const lastAttributeNameRegex =
    /([ \x09\x0a\x0c\x0d])([^\0-\x1F\x7F-\x9F \x09\x0a\x0c\x0d"'>=/]+)([ \x09\x0a\x0c\x0d]*=[ \x09\x0a\x0c\x0d]*(?:[^ \x09\x0a\x0c\x0d"'`<>=]*|"[^"]*|'[^']*))$/;
