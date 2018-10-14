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

import {TemplateResult} from '../lib/template-result.js';

const stringsCache = new WeakMap<TemplateStringsArray, TemplateStringsArray>();

/**
 * A value that's interpolated directly into the template before parsing.
 *
 * Static values cannot be updated, since they don't define a part and are
 * effectively merged into the literal part of a lit-html template. Because
 * they are interpolated before the template is parsed as HTML, static values
 * may occupy positions in the template that regular interpolations may not,
 * such as tag and attribute names.
 *
 * UnsafeStatic values are inherently very unsafe, as the name states. They
 * can break well-formedness assumptions and aren't escaped, and thus a
 * potential XSS vulnerability if created from user-provided data.
 *
 * It's recommended that no user templates ever use UnsafeStatic directly,
 * but directive-like functions are written by library authors to validate
 * and sanitize values for a specific purpose, before wrapping in an
 * UnsafeStatic value.
 *
 * An example would be a `tag()` directive that lets a template contain tags
 * whose names aren't known until runtime, like:
 *
 *     html`<${tag(myTagName)>Whoa</tag(MyElement)>`
 *
 * Here, `tag()` should validate that `myTagName` is a valid HTML tag name,
 * and throw if it contains any illegal characters.
 */
export class UnsafeStatic {
  readonly value: unknown;

  constructor(value: unknown) {
    this.value = value;
  }
}

/**
 * Interpolates a value before template parsing and making it available to
 * template pre-processing steps.
 *
 * Static values cannot be updated, since they don't define a part and are
 * effectively merged into the literal part of a lit-html template. Because
 * they are interpolated before the template is parsed as HTML, static values
 * may occupy positions in the template that regular interpolations may not,
 * such as tag and attribute names.
 */
export const unsafeStatic = (value: unknown) => new UnsafeStatic(value);

/**
 * Decorates initial `html` function to produce preprocessed templates that
 * include unsafe static values.
 *
 * No sanitization provided. Any static value is considered as a string and
 * merged to a template, so it can lead to undefined behavior if you use
 * angle brackets or any other html-specific symbols.
 *
 * Updating static values is impossible. If you try to replace one static
 * value with another, it will be ignored, and if it is a dynamic value,
 * the error will be thrown.
 *
 * @param processor `html` function
 */
export const withUnsafeStatic =
    (processor: (strings: TemplateStringsArray, ...values: any[]) =>
         TemplateResult) => (strings: TemplateStringsArray, ...values: any[]) => {
      let finalStrings: any|undefined = stringsCache.get(strings);

      if (!finalStrings) {
        // Convert the initial array of strings into a new one with merged
        // static values. Values array is used only to know where the static
        // value is placed.
        if (values.some((v) => v instanceof UnsafeStatic)) {
          finalStrings = [];

          let previousValueWasStatic = false;

          for (let i = 0; i < strings.length; i++) {
            if (previousValueWasStatic) {
              // Append the string part that follows static value.
              finalStrings[finalStrings.length - 1] += strings[i];
            } else {
              finalStrings.push(strings[i]);
            }

            // Since length of values array is N and strings array is N+1,
            // it is necessary to check if we have crossed the values
            // boundaries.
            if (i < values.length && values[i] instanceof UnsafeStatic) {
              // Append static value.
              finalStrings[finalStrings.length - 1] += String(values[i].value);
              previousValueWasStatic = true;
            } else {
              previousValueWasStatic = false;
            }
          }
        } else {
          // if there is no static value remember original strings array
          finalStrings = strings;
        }

        stringsCache.set(strings, finalStrings);
      }

      // If there is static values remove all statics from it. Otherwise,
      // just use original values array.
      const finalValues = finalStrings !== strings ?
          values.filter((v) => !(v instanceof UnsafeStatic)) :
          values;

      // If user try to replace static value with dynamic one we cannot filter
      // it. It produces different amount of filtered values we have so we can
      // catch it and throw an error to avoid undefined behavior during template
      // update.
      if (finalValues.length >= finalStrings.length) {
        throw new Error(
            'Amount of values provided does not fit amount of available parts. ' +
            'It could happen if you try to change your UnsafeStatic value to a dynamic one.');
      }

      return processor(finalStrings, ...finalValues);
    };
