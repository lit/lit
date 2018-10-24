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

import {TemplateResult} from './template-result.js';
import {marker, Template} from './template.js';

/**
 * A function type that creates a Template from a TemplateResult.
 *
 * This is a hook into the template-creation process for rendering that
 * requires some modification of templates before they're used, like ShadyCSS,
 * which must add classes to elements and remove styles.
 *
 * Templates should be cached as aggressively as possible, so that many
 * TemplateResults produced from the same expression only do the work of
 * creating the Template the first time.
 *
 * Templates are usually cached by TemplateResult.strings and
 * TemplateResult.type, but may be cached by other keys if this function
 * modifies the template.
 *
 * Note that currently TemplateFactories must not add, remove, or reorder
 * expressions, because there is no way to describe such a modification
 * to render() so that values are interpolated to the correct place in the
 * template instances.
 */
export type TemplateFactory = (result: TemplateResult) => Template;

/**
 * The default TemplateFactory which caches Templates keyed on
 * result.type and result.strings.
 */
export function templateFactory(result: TemplateResult) {
  let templateCache = templateCaches.get(result.type);
  if (templateCache === undefined) {
    templateCache = new Map<string, Template>();
    templateCaches.set(result.type, templateCache);
  }
  let key = templateKeys.get(result.strings);
  if (key !== undefined) {
    // If templateKeys has the key it's guaranteed to exist in the templateCache
    return templateCache.get(key)!;
  }

  // If the result.strings are new, generate a key and set it in templateKeys
  key = result.strings.join(marker);
  templateKeys.set(result.strings, key);

  let template = templateCache.get(key);
  if (template === undefined) {
    template = new Template(result, result.getTemplateElement());
  } else {
    // If a template already exists, refresh the key object in the templateCache
    templateCache.delete(key);
  }
  templateCache.set(key, template);
  return template;
}

/**
 * The first argument to JS template tags retain identity across multiple
 * calls to a tag for the same literal, so we can cache work done per literal
 * in a Map.
 *
 * Safari currently has a bug which occasionally breaks this behaviour, so we
 * have to generate a key that retains identity by joining the
 * TemplateResult.strings with a marker.
 */
export const templateCaches = new Map<string, Map<string, Template>>();

// This maps the TemplateResult.strings to our generated key
export const templateKeys = new WeakMap<TemplateStringsArray, string>();
