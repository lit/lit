/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * Elements and their special properties that should be reflected to attributes
 * when set.
 *
 * Each item in the array takes the following format:
 *
 * Item 0: Element name or array of element names.
 * Rest of items:
 *    Array of [property name, reflected attribute name]
 *    or
 *    property name (if reflected attribute name is identical).
 */
// TODO: fill out complete list based on DOM IDL:
// https://github.com/Polymer/lit-html/issues/1380
const reflectedAttributesSource: (string | string[])[][] = [
  [['input', 'select'], 'value'],
  ['*', ['className', 'class'], 'id'],
];

/**
 * Construct reflectedAttributes as nested maps for efficient lookup.
 */
const reflectedAttributes = new Map<string, Map<string, string>>();
const addPropertyForElement = (
  elementName: string,
  propertyName: string,
  attributeName: string
) => {
  if (reflectedAttributes.has(elementName)) {
    reflectedAttributes.get(elementName)!.set(propertyName, attributeName);
  } else {
    reflectedAttributes.set(
      elementName,
      new Map([[propertyName, attributeName]])
    );
  }
};
const addPropertiesForElement = (
  elementName: string,
  propertyNames: Array<string | Array<string>>
) => {
  for (const propertyName of propertyNames) {
    if (propertyName instanceof Array) {
      // Property has a different attribute name.
      addPropertyForElement(elementName, propertyName[0], propertyName[1]);
    } else {
      addPropertyForElement(elementName, propertyName, propertyName);
    }
  }
};
for (const entry of reflectedAttributesSource) {
  if (entry[0] instanceof Array) {
    for (const elementName of entry[0]) {
      addPropertiesForElement(elementName, entry.slice(1));
    }
  } else {
    addPropertiesForElement(entry[0] as string, entry.slice(1));
  }
}

/**
 * Return the attribute name that reflects from the given property
 * name on the given element.
 *
 * Example: for all elements, the property 'className' reflects to
 * the 'class' attribute, so:
 * reflectedAttributeName('div', 'className') returns 'class'
 */
export const reflectedAttributeName = (
  elementName: string,
  propertyName: string
): string | undefined => {
  const attributes = reflectedAttributes.get(elementName);
  if (attributes !== undefined && attributes.has(propertyName)) {
    return attributes.get(propertyName);
  } else {
    return reflectedAttributes.get('*')!.get(propertyName);
  }
};
