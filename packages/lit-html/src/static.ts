/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

// Any new exports need to be added to the export statement in
// `packages/lit/src/index.all.ts`.

import {html as coreHtml, svg as coreSvg, TemplateResult} from './lit-html.js';

export interface StaticValue {
  /** The value to interpolate as-is into the template. */
  _$litStatic$: string;

  /**
   * A value that can't be decoded from ordinary JSON, make it harder for
   * a attacker-controlled data that goes through JSON.parse to produce a valid
   * StaticValue.
   */
  r: typeof brand;
}

/**
 * Prevents JSON injection attacks.
 *
 * The goals of this brand:
 *   1) fast to check
 *   2) code is small on the wire
 *   3) multiple versions of Lit in a single page will all produce mutually
 *      interoperable StaticValues
 *   4) normal JSON.parse (without an unusual reviver) can not produce a
 *      StaticValue
 *
 * Symbols satisfy (1), (2), and (4). We use Symbol.for to satisfy (3), but
 * we don't care about the key, so we break ties via (2) and use the empty
 * string.
 */
const brand = Symbol.for('');

/** Safely extracts the string part of a StaticValue. */
const unwrapStaticValue = (value: unknown): string | undefined => {
  if ((value as Partial<StaticValue>)?.r !== brand) {
    return undefined;
  }
  return (value as Partial<StaticValue>)?.['_$litStatic$'];
};

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
export const unsafeStatic = (value: string): StaticValue => ({
  ['_$litStatic$']: value,
  r: brand,
});

const textFromStatic = (value: StaticValue) => {
  if (value['_$litStatic$'] !== undefined) {
    return value['_$litStatic$'];
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
export const literal = (
  strings: TemplateStringsArray,
  ...values: unknown[]
): StaticValue => ({
  ['_$litStatic$']: values.reduce(
    (acc, v, idx) => acc + textFromStatic(v as StaticValue) + strings[idx + 1],
    strings[0]
  ) as string,
  r: brand,
});

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
        const valueString = unwrapStaticValue(value);
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
      // Beware: in general this pattern is unsafe, and doing so may bypass
      // lit's security checks and allow an attacker to execute arbitrary
      // code and inject arbitrary content.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (staticStrings as any).raw = staticStrings;
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
