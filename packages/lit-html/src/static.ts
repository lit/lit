import {html as coreHtml, svg as coreSvg, TemplateResult} from './lit-html.js';

/**
 * Wraps a string so that it behaves like part of the static template
 * strings instead of a dynamic value.
 *
 * This is a very unsafe operation and may break templates if changes
 * the structure of a template. Do not pass user input to this function
 * without sanitizing it.
 */
export const unsafeStatic = (value: string) => ({
  _$litStatic$: value,
});

type StaticValue = ReturnType<typeof unsafeStatic>;

const stringsCache = new WeakMap<TemplateStringsArray, TemplateStringsArray>();

/**
 * Generates a template literal tag function that returns a TemplateResult with
 * the given result type.
 */
const tag = (coreTag: typeof coreHtml) => (
  strings: TemplateStringsArray,
  ...values: unknown[]
): TemplateResult => {
  let processedStrings = stringsCache.get(strings);
  if (processedStrings === undefined) {
    const newStrings: Array<string> = [];
    const l = strings.length - 1;
    let i = 0;

    while (i < l) {
      let s = strings[i];

      // Collect any unsafeStatic values, and their following template strings
      // so that we treat a run of template strings and unsafe static values as
      // a single template string.
      while (i < l && (values[i] as StaticValue)?._$litStatic$ !== undefined) {
        s += (values[i] as StaticValue)?._$litStatic$ + strings[++i];
      }
      newStrings.push(s);
      // If by consuming unsafe static values we use the last template string,
      // then this template has no dynamic bindings.
      if (i++ > l) {
        break;
      }
    }
    if (i <= l) {
      newStrings.push(strings[l]);
    }
    // (newStrings as any as {raw: Array<string>}).raw = newStrings;
    stringsCache.set(
      strings,
      (processedStrings = (newStrings as unknown) as TemplateStringsArray)
    );
  }

  return coreTag(
    processedStrings,
    ...values.filter(
      (v) => v != null && (v as StaticValue)._$litStatic$ === undefined
    )
  );
};

/**
 * Interprets a template literal as an HTML template that can efficiently
 * render to and update a container.
 */
export const html = tag(coreHtml);

/**
 * Interprets a template literal as an SVG template that can efficiently
 * render to and update a container.
 */
export const svg = tag(coreSvg);
