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

import {defaultPartCallback, PartCallback} from './part-callback.js';
import {Template} from './template.js';
import {TemplateInstance} from './template-instance.js';
import {TemplatePart} from './template-part.js';
import {TemplateResult} from './template-result.js';
import {Part} from './part.js';

import {removeNodes} from './nodes.js';

export {Part, Template, TemplateInstance, TemplatePart, TemplateResult, defaultPartCallback};
export {DirectiveFn, directive} from './directive.js';
export {AttributePart} from './attribute-part.js';
export {NodePart} from './node-part.js';
export {MultiPart, SinglePart} from './part.js';

/**
 * TypeScript has a problem with precompiling templates literals
 * https://github.com/Microsoft/TypeScript/issues/17956
 *
 * TODO(justinfagnani): Run tests compiled to ES5 with both Babel and
 * TypeScript to verify correctness.
 */
const envCachesTemplates =
    ((t: any) => t() === t())(() => ((s: TemplateStringsArray) => s) ``);

// The first argument to JS template tags retain identity across multiple
// calls to a tag for the same literal, so we can cache work done per literal
// in a Map.
const templates = new Map<TemplateStringsArray|string, Template>();
const svgTemplates = new Map<TemplateStringsArray|string, Template>();

/**
 * Interprets a template literal as an HTML template that can efficiently
 * render to and update a container.
 */
export const html = (strings: TemplateStringsArray, ...values: any[]) =>
    litTag(strings, values, templates, false);

/**
 * Interprets a template literal as an SVG template that can efficiently
 * render to and update a container.
 */
export const svg = (strings: TemplateStringsArray, ...values: any[]) =>
    litTag(strings, values, svgTemplates, true);

function litTag(
    strings: TemplateStringsArray,
    values: any[],
    templates: Map<TemplateStringsArray|string, Template>,
    isSvg: boolean): TemplateResult {
  const key = envCachesTemplates ?
      strings :
      strings.join('{{--uniqueness-workaround--}}');
  let template = templates.get(key);
  if (template === undefined) {
    template = new Template(strings, isSvg);
    templates.set(key, template);
  }
  return new TemplateResult(template, values);
}

/**
 * Renders a template to a container.
 *
 * To update a container with new values, reevaluate the template literal and
 * call `render` with the new result.
 */
export function render(
    result: TemplateResult,
    container: Element|DocumentFragment,
    partCallback: PartCallback = defaultPartCallback) {
  let instance = (container as any).__templateInstance as any;

  // Repeat render, just call update()
  if (instance !== undefined && instance.template === result.template &&
      instance._partCallback === partCallback) {
    instance.update(result.values);
    return;
  }

  // First render, create a new TemplateInstance and append it
  instance = new TemplateInstance(result.template, partCallback);
  (container as any).__templateInstance = instance;

  const fragment = instance._clone();
  instance.update(result.values);

  removeNodes(container, container.firstChild);
  container.appendChild(fragment);
}

export const getValue = (part: Part, value: any) => {
  // `null` as the value of a Text node will render the string 'null'
  // so we convert it to undefined
  if (value != null && value.__litDirective === true) {
    value = value(part);
  }
  return value === null ? undefined : value;
};
