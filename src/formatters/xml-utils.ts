/**
 * @license
 * Copyright (c) 2020 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt The complete set of authors may be found
 * at http://polymer.github.io/AUTHORS.txt The complete set of contributors may
 * be found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by
 * Google as part of the polymer project is also subject to an additional IP
 * rights grant found at http://polymer.github.io/PATENTS.txt
 */

import * as prettier from 'prettier';

/**
 * Query the given parent element for a descendent with the given tag name and
 * return it, or throw if none or more than one are found.
 */
export function getOneElementByTagNameOrThrow(
  parent: Document | Element,
  tagName: string
): Element {
  const matches = parent.getElementsByTagName(tagName);
  if (matches.length !== 1) {
    const parentName = 'tagName' in parent ? `<${parent.tagName}>` : 'document';
    throw new Error(
      `Expected 1 <${tagName}> in ${parentName}, got ${matches.length}`
    );
  }
  return matches[0];
}

/**
 * Return an attribute value from the given element, or throw if there is no
 * such attribute or it is the empty string.
 */
export function getNonEmptyAttributeOrThrow(
  element: Element,
  attributeName: string
): string {
  const attribute = element.getAttribute(attributeName);
  if (!attribute) {
    throw new Error(
      `Expected <${element.tagName}> to have ` +
        `non-empty attribute ${attributeName}`
    );
  }
  return attribute;
}

/**
 * Format the given serialized XML using Prettier.
 */
export function formatXml(xmlStr: string): string {
  // TODO(aomarks) Types for the xml-parser plugin.
  return prettier.format(xmlStr, ({
    parser: 'xml',
    xmlWhitespaceSensitivity: 'ignore',
  } as unknown) as prettier.Options);
}
