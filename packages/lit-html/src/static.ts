/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import {html as coreHtml, svg as coreSvg, TemplateResult} from './lit-html.js';

/**
 * Wraps a string so that it behaves like part of the static template
 * strings instead of a dynamic value.
 *
 * Users must take care to ensure that adding the static string to the template
 * results in well-formed HTML, or else templates may break unexpectedly.
 *
 * Note that this function is unsafe to use on untrusted content, as it will be
 * directly parsed into HTML. Do not pass user input to this function
 * without sanitizing it.
 *
 * Static values can be changed, but they will cause a complete re-render
 * since they effectively create a new template.
 */
export const unsafeStatic = (value: string) => ({
  _$litStatic$: value,
});

const textFromStatic = (value: StaticValue): string => {
  if (value._$litStatic$ !== undefined) {
    return value._$litStatic$;
  } else {
    throw new Error(
      `Value passed to 'literal' function must be a 'literal' result: ${value}. Use 'unsafeStatic' to pass non-literal values, but
            take care to ensure page security.`
    );
  }
};

/**
 * Tags a string literal so that it behaves like part of the static template
 * strings instead of a dynamic value.
 *
 * The only values that may be used in template expressions are other tagged
 * `literal` results or `unsafeStatic` values (note that untrusted content
 * should never be passed to `unsafeStatic`).
 *
 * Users must take care to ensure that adding the static string to the template
 * results in well-formed HTML, or else templates may break unexpectedly.
 *
 * Static values can be changed, but they will cause a complete re-render since
 * they effectively create a new template.
 */
export const literal = (strings: TemplateStringsArray, ...values: unknown[]) =>
  unsafeStatic(
    values.reduce(
      (acc, v, idx) =>
        acc + textFromStatic(v as StaticValue) + strings[idx + 1],
      strings[0]
    ) as string
  );

type StaticValue = ReturnType<typeof unsafeStatic>;

type StaticTemplate = {
  strings: Array<string>;
  values: Array<StaticValue | undefined>;
};

const stringsCache = new WeakMap<TemplateStringsArray, StaticTemplate>();

/**
 * Wraps a lit-html template tag (`html` or `svg`) to add static value support.
 */
export const withStatic = (coreTag: typeof coreHtml | typeof coreSvg) => (
  strings: TemplateStringsArray,
  ...values: unknown[]
): TemplateResult => {
  let staticTemplate = stringsCache.get(strings);
  RESTART: for (;;) {
    if (staticTemplate === undefined) {
      const staticStrings = [];
      const staticValues = [];
      let s: string = strings[0];
      for (let i = 0; i < values.length; ++i) {
        let value = values[i] as StaticValue | undefined;
        const valueString = value?._$litStatic$;
        if (valueString !== undefined) {
          s += valueString + strings[i + 1];
        } else {
          staticStrings.push(s);
          s = strings[i + 1];
          value = undefined;
        }
        staticValues.push(value);
      }
      staticStrings.push(s);
      staticTemplate = {strings: staticStrings, values: staticValues};
      stringsCache.set(strings, staticTemplate);
    }
    const dynamicValues = [];
    for (let i = 0; i < values.length; ++i) {
      const staticValue = staticTemplate.values[i];
      const value = values[i] as StaticValue | undefined;
      if (staticValue === undefined) {
        if (value?._$litStatic$ !== undefined) {
          staticTemplate = undefined;
          continue RESTART;
        }
        dynamicValues.push(value);
      } else if (staticValue !== value) {
        staticTemplate = undefined;
        continue RESTART;
      }
    }
    return coreTag(
      (staticTemplate.strings as unknown) as TemplateStringsArray,
      ...dynamicValues
    );
  }
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
