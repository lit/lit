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

export const documentComplete = async () => {
  // wait until after page loads
  if (document.readyState !== 'complete') {
    let resolve: () => void;
    const p = new Promise((r) => (resolve = r));
    document.addEventListener('readystatechange', async () => {
      if (document.readyState === 'complete') {
        resolve();
      }
    });
    await p;
  }
  await new Promise((r) => setTimeout(r));
};
