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
import {html as coreHtml, svg as coreSvg, TemplateResult} from './lit-html.js';

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
export const unsafeStatic = (value: string) => ({
  _$litStatic$: value,
});

type StaticValue = ReturnType<typeof unsafeStatic>;

const stringsCache = new Map<string, TemplateStringsArray>();

/**
 * Wraps a lit-html template tag (`html` or `svg`) to add static value support.
 */
export const withStatic = (coreTag: typeof coreHtml | typeof coreSvg) => (
  strings: TemplateStringsArray,
  ...values: unknown[]
): TemplateResult => {
  const l = values.length;
  let staticValue: string | undefined;
  let dynamicValue: unknown;
  const staticStrings: Array<string> = [];
  const dynamicValues: Array<unknown> = [];
  let i = 0;
  let hasStatics = false;
  let s: string;

  while (i < l) {
    s = strings[i];
    // Collect any unsafeStatic values, and their following template strings
    // so that we treat a run of template strings and unsafe static values as
    // a single template string.
    while (
      i < l &&
      ((dynamicValue = values[i]),
      (staticValue = (dynamicValue as StaticValue)?._$litStatic$)) !== undefined
    ) {
      s += staticValue + strings[++i];
      hasStatics = true;
    }
    dynamicValues.push(dynamicValue);
    staticStrings.push(s);
    i++;
  }
  // If the last value isn't static (which would have consumed the last
  // string), then we need to add the last string.
  if (i === l) {
    staticStrings.push(strings[l]);
  }

  if (hasStatics) {
    const key = staticStrings.join('$$lit$$');
    strings = stringsCache.get(key)!;
    if (strings === undefined) {
      stringsCache.set(
        key,
        (strings = (staticStrings as unknown) as TemplateStringsArray)
      );
    }
    values = dynamicValues;
  }
  return coreTag(strings, ...values);
};

/**
 * Interprets a template literal as an HTML template that can efficiently
 * render to and update a container.
 *
 * Includes static value support from `lit-html/static.js`.
 */
export const html = withStatic(coreHtml);

/**
 * Interprets a template literal as an SVG template that can efficiently
 * render to and update a container.
 *
 * Includes static value support from `lit-html/static.js`.
 */
export const svg = withStatic(coreSvg);
