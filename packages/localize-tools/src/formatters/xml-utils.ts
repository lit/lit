/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

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
