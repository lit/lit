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

import {TemplateResult} from './template-result.js';

/**
 * An expression marker with embedded unique key to avoid collision with
 * possible text in templates.
 */
export const marker = `{{lit-${String(Math.random()).slice(2)}}}`;

/**
 * An expression marker used text-positions, multi-binding attributes, and
 * attributes with markup-like text values.
 */
export const nodeMarker = `<!--${marker}-->`;

export const markerRegex = new RegExp(`${marker}|${nodeMarker}`);

/**
 * A marker used to say the next sibling holds a part.
 */
export const partMarker = `${marker}-part:`;

/**
 * A marker that says the previous sibling is a template element.
 */
export const templateMarker = `${marker}-template`;

/**
 * Suffix appended to all bound attribute names.
 */
export const boundAttributeSuffix = '$lit$';

/**
 * An updateable Template that tracks the location of dynamic parts.
 */
export class Template {
  parts: Array<TemplatePart|undefined> = [];
  element: HTMLTemplateElement;

  constructor(result: TemplateResult, element: HTMLTemplateElement) {
    this.element = element;

    // Edge needs all 4 parameters present; IE11 needs 3rd parameter to be null
    const walker = document.createTreeWalker(
        element.content,
        133 /* NodeFilter.SHOW_{ELEMENT|COMMENT|TEXT} */,
        null,
        false);
    const nodesToRemove: Node[] = [];
    const stack: Node[] = [];

    // Keeps track of the last part's staring node. We try to delete
    // unnecessary nodes, but we never want to associate two different parts to
    // the same starting node. They must have a constant node between.
    let lastPartStart = null;
    let partIndex = 0;

    while (true) {
      const node = walker.nextNode() as Element | Comment | Text | null;
      if (node === null) {
        const template = stack.pop();
        if (!template) {
          // Done traversing.
          break;
        }
        // We've exhausted the content inside a nested template element. Reset
        // the walker to the template element itself and try to walk from there.
        walker.currentNode = template;
        continue;
      }

      if (node.nodeType === 1 /* Node.ELEMENT_NODE */) {
        if ((node as Element).hasAttributes()) {
          const attributes = (node as Element).attributes;
          const {length} = attributes;
          // Per
          // https://developer.mozilla.org/en-US/docs/Web/API/NamedNodeMap,
          // attributes are not guaranteed to be returned in document order.
          // In particular, Edge/IE can return them out of order, so we cannot
          // assume a correspondance between part index and attribute index.
          let count = 0;
          for (let i = 0; i < length; i++) {
            if (attributes[i].value.indexOf(marker) >= 0) {
              count++;
            }
          }
          if (count > 0) {
            insertPartMarker(node, partIndex, count);
          }
          while (count-- > 0) {
            // Get the template literal section leading up to the first
            // expression in this attribute
            const stringForPart = result.strings[partIndex];
            // Find the attribute name
            const name = lastAttributeNameRegex.exec(stringForPart)![2];
            // Find the corresponding attribute
            // All bound attributes have had a suffix added in
            // TemplateResult#getHTML to opt out of special attribute
            // handling. To look up the attribute value we also need to add
            // the suffix.
            const attributeLookupName =
                name.toLowerCase() + boundAttributeSuffix;
            const attributeValue =
                (node as Element).getAttribute(attributeLookupName)!;
            const strings = attributeValue.split(markerRegex);
            this.parts.push({type: 'attribute', name, strings});
            (node as Element).removeAttribute(attributeLookupName);
            partIndex += strings.length - 1;
          }
        }
        if ((node as Element).tagName === 'TEMPLATE') {
          const tm = createMarker(templateMarker);
          node.parentNode!.insertBefore(tm, node.nextSibling);
          stack.push(tm);
          walker.currentNode = (node as HTMLTemplateElement).content;
        }
      } else if (node.nodeType === 3 /* Node.TEXT_NODE */) {
        const data = (node as Text).data;
        if (data.indexOf(marker) >= 0) {
          const parent = node.parentNode!;
          const strings = data.split(markerRegex);
          const lastIndex = strings.length - 1;
          // Generate a new text node for each literal section
          // These nodes are also used as the markers for node parts
          for (let i = 0; i < lastIndex; i++) {
            parent.insertBefore(
                (strings[i] === '') ? createMarker('') :
                                      document.createTextNode(strings[i]),
                node);
            insertPartMarker(node, partIndex++, 0);
            this.parts.push({type: 'node'});
          }
          // If there's no text, we must insert a comment to mark our place.
          // Else, we can trust it will stick around after cloning.
          if (strings[lastIndex] === '') {
            parent.insertBefore(createMarker(''), node);
            nodesToRemove.push(node);
          } else {
            (node as Text).data = strings[lastIndex];
          }
        }
      } else if (node.nodeType === 8 /* Node.COMMENT_NODE */) {
        if ((node as Comment).data === marker) {
          const parent = node.parentNode!;
          // Add a new marker node to be the startNode of the Part if any of
          // the following are true:
          //  * We don't have a previousSibling
          //  * The previousSibling is already the start of a previous part
          const {previousSibling} = node;
          if (previousSibling === null || previousSibling === lastPartStart) {
            lastPartStart = parent.insertBefore(createMarker(''), node);
          }
          insertPartMarker(node, partIndex++, 0);
          this.parts.push({type: 'node'});
          // If we don't have a nextSibling, keep this node so we have an end.
          // Else, we can remove it to save future costs.
          if (node.nextSibling === null) {
            (node as Comment).data = '';
          } else {
            lastPartStart = node;
            nodesToRemove.push(node);
          }
        } else {
          let i = -1;
          while ((i = (node as Comment).data.indexOf(marker, i + 1)) !== -1) {
            // Comment node has a binding marker inside, make an inactive part
            // The binding won't work, but subsequent bindings will
            // TODO (justinfagnani): consider whether it's even worth it to
            // make bindings in comments work
            this.parts.push(undefined);
            partIndex++;
          }
        }
      }
    }

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
}|{type: 'attribute', name: string, strings: string[]};

// Allows `document.createComment('')` to be renamed for a
// small manual size-savings.
export const createMarker = (data: string) => document.createComment(data);

// Creates a comment with the part index and number of attributes. The
// attribute count occupies the 16 high bits, and the part index the 16 low
// bits.
export const insertPartMarker =
    (node: Node, partIndex: number, attributeCount: number) =>
        node.parentNode!.insertBefore(
            createMarker(`${partMarker}${attributeCount << 16 | partIndex}`),
            node);

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
