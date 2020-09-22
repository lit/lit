/**
 * @license
 * Copyright (c) 2020 The Polymer Project Authors. All rights reserved.
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

export function trustedTypesIsEnforced(): boolean {
  const div = document.createElement('div');
  try {
    div.innerHTML = '<img src="#">';
  } catch {
    return true;
  }
  return false;
}

function getPolicy() {
  let policy = {
    createHTML(rawHtml: string) {
      return rawHtml;
    }
  };
  if (window.trustedTypes !== undefined) {
    policy = window.trustedTypes.createPolicy('unsafehtml-test', policy) as
        unknown as typeof policy;
  }
  return policy;
}

export const policy = getPolicy();