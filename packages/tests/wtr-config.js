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

import * as pathLib from 'path';
import {fileURLToPath} from 'url';

const packagesDir = pathLib.resolve(
  pathLib.dirname(fileURLToPath(import.meta.url)),
  '..'
);

/**
 * rollup-resolve-remap config that remaps any lit-html or lit-element imports
 * to their minified production versions (works for both bare and path module
 * specifiers).
 */
export const prodResolveRemapConfig = {
  root: packagesDir,
  remap: [
    // The development/test/ directories are special, there are no production
    // versions of these.
    {from: 'lit-html/development/test/', to: null},
    {from: 'lit-element/development/test/', to: null},
    {from: 'reactive-element/development/test/', to: null},
    // Remap any other development/ modules up one level to the production
    // version.
    {from: 'lit-html/development/', to: 'lit-html/'},
    {from: 'lit-element/development/', to: 'lit-element/'},
    {from: 'reactive-element/development/', to: 'reactive-element/'},
  ],
};

/**
 * rollup-resolve-remap config that remaps any lit-html or lit-element imports
 * to the un-minified development versions.
 */
export const devResolveRemapConfig = {
  root: packagesDir,
  remap: [
    // Don't remap external dependencies.
    {from: 'lit-html/node_modules/', to: null},
    {from: 'lit-element/node_modules/', to: null},
    {from: 'reactive-element/node_modules/', to: null},
    // If we're already reaching into development/, nothing to change.
    {from: 'lit-html/development/', to: null},
    {from: 'lit-element/development/', to: null},
    {from: 'reactive-element/development/', to: null},
    // Everything else is a production version; remap to the development
    // version.
    {from: 'lit-html/', to: 'lit-html/development/'},
    {from: 'lit-element/', to: 'lit-element/development/'},
    {from: 'reactive-element/', to: 'reactive-element/development/'},
  ],
};
