/**
 * @license
 * Copyright (c) 2019 The Polymer Project Authors. All rights reserved.
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
