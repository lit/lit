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
import { html as coreHtml, TemplateResult } from './lit-html.js';
/**
 * Wraps a string so that it behaves like part of the static template
 * strings instead of a dynamic value.
 *
 * This is a very unsafe operation and may break templates if changes
 * the structure of a template. Do not pass user input to this function
 * without sanitizing it.
 *
 * Static values can be changed, but they will cause a complete re-render
 * since they effectively create a new template.
 */
export declare const unsafeStatic: (value: string) => {
    _$litStatic$: string;
};
/**
 * Wraps a lit-html template tag (`html` or `svg`) to add static value support.
 */
export declare const withStatic: (coreTag: typeof coreHtml) => (strings: TemplateStringsArray, ...values: unknown[]) => TemplateResult;
/**
 * Interprets a template literal as an HTML template that can efficiently
 * render to and update a container.
 *
 * Includes static value support from `lit-html/static.js`.
 */
export declare const html: (strings: TemplateStringsArray, ...values: unknown[]) => TemplateResult;
/**
 * Interprets a template literal as an SVG template that can efficiently
 * render to and update a container.
 *
 * Includes static value support from `lit-html/static.js`.
 */
export declare const svg: (strings: TemplateStringsArray, ...values: unknown[]) => TemplateResult;
//# sourceMappingURL=static.d.ts.map