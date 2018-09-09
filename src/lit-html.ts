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

import {defaultTemplateProcessor} from './lib/default-template-processor.js';
import {SVGTemplateResult, TemplateResult} from './lib/template-result.js';

export * from './lib/template-result.js';
export * from './lib/template.js';
export * from './lib/template-processor.js';
export * from './lib/default-template-processor.js';
export * from './lib/template-instance.js';
export * from './lib/part.js';
export * from './lib/parts.js';
export * from './lib/dom.js';
export * from './lib/directive.js';
export * from './lib/render.js';
export * from './lib/template-factory.js';

/**
 * Interprets a template literal as an HTML template that can efficiently
 * render to and update a container.
 */
export const html = (strings: TemplateStringsArray, ...values: any[]) =>
    new TemplateResult(strings, values, 'html', defaultTemplateProcessor);

/**
 * Interprets a template literal as an SVG template that can efficiently
 * render to and update a container.
 */
export const svg = (strings: TemplateStringsArray, ...values: any[]) =>
    new SVGTemplateResult(strings, values, 'svg', defaultTemplateProcessor);
