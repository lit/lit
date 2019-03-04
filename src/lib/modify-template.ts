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
 * @module shady-render
 */

import {partMarker, Template, TemplatePart} from './template.js';

/**
 * Removes all style elements from the template. In addition to removing
 * elements, the Template's parts array is updated to match the mutated
 * Template DOM.
 */
export function removeStylesFromTemplate(template: Template) {
  const {parts, element: {content}} = template;
  const styles = content.querySelectorAll('style');
  const {length} = styles;
  if (length === 0) {
    return;
  }

  const walker = document.createTreeWalker(
      document, 128 /* NodeFilter.SHOW_COMMENT */, null, false);

  for (let i = 0; i < length; i++) {
    const style = styles[i];
    const {previousSibling, parentNode} = style;

    parentNode!.removeChild(style);

    // Is the previousSibling a part marker comment? If so, we need to remove
    // it.
    if (isPartMarker(previousSibling)) {
      removePartForMarker(parts, previousSibling);
      parentNode!.removeChild(previousSibling);
    }

    // If there are any part markers for text nodes (the only possible binding
    // in a style element), we need to update those indices in the parts array,
    // too.
    walker.currentNode = style;
    while (walker.nextNode()) {
      const comment = walker.currentNode as Comment;
      if (isPartMarker(comment)) {
        removePartForMarker(parts, comment);
      }
    }
  }
}

const removePartForMarker =
    (parts: Array<TemplatePart|undefined>, comment: Comment) => {
      // The part marker signifies the NodePart's index in the 16 low bits.
      const packed = parseInt(comment.data.slice(partMarker.length), 10);
      parts[packed & 0xffff] = undefined;
    };

const isPartMarker = (comment: Node|null): comment is Comment => {
  return comment !== null && comment.nodeType === 8 /* Node.COMMENT_NODE */ &&
      (comment as Comment).data.slice(0, partMarker.length) === partMarker;
};
