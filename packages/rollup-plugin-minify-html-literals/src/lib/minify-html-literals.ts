import MagicString, {SourceMapOptions} from 'magic-string';
import {ParseLiteralsOptions, parseLiterals} from './parse-literals.js';
import {Template, TemplatePart} from './models.js';
import {Strategy, defaultMinifyOptions, defaultStrategy} from './strategy.js';

/**
 * Options for <code>minifyHTMLLiterals()</code>.
 */
export type Options = DefaultOptions | CustomOptions<unknown>;

/**
 * Options for <code>minifyHTMLLiterals()</code>, using default html-minifier
 * strategy.
 */
export interface DefaultOptions extends BaseOptions {
  /**
   * <code>html-minifier</code> options to use. Defaults to
   * <code>defaultMinifyOptions</code>, for production-ready minification.
   */
  minifyOptions?: Partial<typeof defaultMinifyOptions>;
}

/**
 * Options for <code>minifyHTMLLiterals()</code>, using a custom strategy.
 */
export interface CustomOptions<S extends Strategy | unknown>
  extends BaseOptions {
  /**
   * HTML minification options.
   */
  minifyOptions?: S extends Strategy<infer O> ? Partial<O> : never;
  /**
   * Override the default strategy for how to minify HTML. The default is to
   * use <code>html-minifier</code>.
   */
  strategy: S;
}

/**
 * Options for <code>minifyHTMLLiterals()</code>.
 */
export interface BaseOptions {
  /**
   * The name of the file. This is used to determine how to parse the source
   * code and for source map filenames. It may be a base name, relative, or
   * absolute path.
   */
  fileName?: string;
  /**
   * Override how source maps are generated. Set to false to disable source map
   * generation.
   *
   * @param ms the MagicString instance with code modifications
   * @param fileName the name or path of the file
   * @returns a v3 SourceMap or undefined
   */
  generateSourceMap?:
    | ((ms: MagicStringLike, fileName: string) => SourceMap | undefined)
    | false;
  /**
   * The MagicString-like constructor to use. MagicString is used to replace
   * strings and generate source maps.
   *
   * Override if you want to set your own version of MagicString or change how
   * strings are overridden. Use <code>generateSourceMap</code> if you want to
   * change how source maps are created.
   */
  MagicString?: {new (source: string): MagicStringLike};
  /**
   * Override how template literals are parsed from a source string.
   */
  parseLiterals?: typeof parseLiterals;
  /**
   * Options for <code>parseLiterals()</code>.
   */
  parseLiteralsOptions?: Partial<ParseLiteralsOptions>;
  /**
   * Determines whether or not a template should be minified. The default is to
   * minify all tagged template whose tag name contains "html" (case
   * insensitive).
   *
   * @param template the template to check
   * @returns true if the template should be minified
   */
  shouldMinify?(template: Template): boolean;
  /**
   * Determines whether or not a CSS template should be minified. The default is
   * to minify all tagged template whose tag name contains "css" (case
   * insensitive).
   *
   * @param template the template to check
   * @returns true if the template should be minified
   */
  shouldMinifyCSS?(template: Template): boolean;
  /**
   * Override custom validation or set to false to disable validation. This is
   * only useful when implementing your own strategy that may return
   * unexpected results.
   */
  validate?: Validation | false;
}

/**
 * A MagicString-like instance. <code>minify-html-literals</code> only uses a
 * subset of the MagicString API to overwrite the source code and generate
 * source maps.
 */
export interface MagicStringLike {
  generateMap(options?: Partial<SourceMapOptions>): SourceMap;
  overwrite(start: number, end: number, content: string): unknown;
  toString(): string;
}

/**
 * A v3 SourceMap.
 *
 * <code>magic-string> incorrectly declares the SourceMap type with a version
 * string instead of a number, so <code>minify-html-literals</code> declares
 * its own type.
 */
export interface SourceMap {
  version: number | string;
  file: string | null;
  sources: Array<string | null>;
  sourcesContent: Array<string | null>;
  names: string[];
  mappings: string;
  toString(): string;
  toUrl(): string;
}

/**
 * Validation that is executed when minifying HTML to ensure there are no
 * unexpected errors. This is to alleviate hard-to-troubleshoot errors such as
 * undefined errors.
 */
export interface Validation {
  /**
   * Throws an error if <code>strategy.getPlaceholder()</code> does not return
   * a valid placeholder string.
   *
   * @param placeholder the placeholder to check
   */
  ensurePlaceholderValid(placeholder: unknown): void;
  /**
   * Throws an error if <code>strategy.splitHTMLByPlaceholder()</code> does not
   * return an HTML part string for each template part.
   *
   * @param parts the template parts that generated the strings
   * @param htmlParts the split HTML strings
   */
  ensureHTMLPartsValid(parts: TemplatePart[], htmlParts: string[]): void;
}

/**
 * The result of a call to <code>minifyHTMLLiterals()</code>.
 */
export interface Result {
  /**
   * The minified code.
   */
  code: string;
  /**
   * Optional v3 SourceMap for the code.
   */
  map: SourceMap | undefined;
}

/**
 * The default method to generate a SourceMap. It will generate the SourceMap
 * from the provided MagicString instance using "fileName.map" as the file and
 * "fileName" as the source.
 *
 * @param ms the MagicString instance with code modifications
 * @param fileName the name of the source file
 * @returns a v3 SourceMap
 */
export function defaultGenerateSourceMap(
  ms: MagicStringLike,
  fileName: string
) {
  return ms.generateMap({
    file: `${fileName}.map`,
    source: fileName,
    hires: true,
  });
}

/**
 * The default method to determine whether or not to minify a template. It will
 * return true for all tagged templates whose tag name contains "html" (case
 * insensitive).
 *
 * @param template the template to check
 * @returns true if the template should be minified
 */
export function defaultShouldMinify(template: Template) {
  const tag = template.tag && template.tag.toLowerCase();
  return !!tag && (tag.includes('html') || tag.includes('svg'));
}

/**
 * The default method to determine whether or not to minify a CSS template. It
 * will return true for all tagged templates whose tag name contains "css" (case
 * insensitive).
 *
 * @param template the template to check
 * @returns true if the template should be minified
 */
export function defaultShouldMinifyCSS(template: Template) {
  return !!template.tag && template.tag.toLowerCase().includes('css');
}

/**
 * The default validation.
 */
export const defaultValidation: Validation = {
  ensurePlaceholderValid(placeholder) {
    if (typeof placeholder !== 'string' || !placeholder.length) {
      throw new Error('getPlaceholder() must return a non-empty string');
    }
  },
  ensureHTMLPartsValid(parts, htmlParts) {
    if (parts.length !== htmlParts.length) {
      throw new Error(
        'splitHTMLByPlaceholder() must return same number of strings as template parts'
      );
    }
  },
};

/**
 * Minifies all HTML template literals in the provided source string.
 *
 * @param source the source code
 * @param options minification options
 * @returns the minified code, or null if no minification occurred.
 */
export function minifyHTMLLiterals(
  source: string,
  options?: DefaultOptions
): Result | null;
/**
 * Minifies all HTML template literals in the provided source string.
 *
 * @param source the source code
 * @param options minification options
 * @returns the minified code, or null if no minification occurred.
 */
export function minifyHTMLLiterals<S extends Strategy>(
  source: string,
  options?: CustomOptions<S>
): Result | null;
export function minifyHTMLLiterals(
  source: string,
  options: Options = {}
): Result | null {
  options.minifyOptions = {
    ...defaultMinifyOptions,
    ...(options.minifyOptions || {}),
  };

  if (!options.MagicString) {
    options.MagicString = MagicString;
  }

  if (!options.parseLiterals) {
    options.parseLiterals = parseLiterals;
  }

  if (!options.shouldMinify) {
    options.shouldMinify = defaultShouldMinify;
  }

  if (!options.shouldMinifyCSS) {
    options.shouldMinifyCSS = defaultShouldMinifyCSS;
  }

  options.parseLiteralsOptions = {
    ...{fileName: options.fileName},
    ...(options.parseLiteralsOptions || {}),
  } as Partial<ParseLiteralsOptions>;

  const templates = options.parseLiterals(source, options.parseLiteralsOptions);
  const strategy =
    <Strategy>(<CustomOptions<unknown>>options).strategy || defaultStrategy;
  const {shouldMinify, shouldMinifyCSS} = options;
  let validate: Validation | undefined;
  if (options.validate !== false) {
    validate = options.validate || defaultValidation;
  }

  const ms = new options.MagicString(source);
  templates.forEach((template) => {
    const minifyHTML = shouldMinify(template);
    const minifyCSS = !!strategy.minifyCSS && shouldMinifyCSS(template);
    if (minifyHTML || minifyCSS) {
      const placeholder = strategy.getPlaceholder(template.parts);
      if (validate) {
        validate.ensurePlaceholderValid(placeholder);
      }

      const combined = strategy.combineHTMLStrings(template.parts, placeholder);
      let min: string;
      if (minifyCSS) {
        const minifyCSSOptions = (
          (options as DefaultOptions).minifyOptions || {}
        ).minifyCSS;
        if (typeof minifyCSSOptions === 'function') {
          min = minifyCSSOptions(combined);
        } else if (minifyCSSOptions === false) {
          min = combined;
        } else {
          const cssOptions =
            typeof minifyCSSOptions === 'object' ? minifyCSSOptions : undefined;
          min = strategy.minifyCSS!(combined, cssOptions);
        }
      } else {
        min = strategy.minifyHTML(combined, options.minifyOptions);
      }

      const minParts = strategy.splitHTMLByPlaceholder(min, placeholder);
      if (validate) {
        validate.ensureHTMLPartsValid(template.parts, minParts);
      }

      template.parts.forEach((part, index) => {
        if (part.start < part.end) {
          // Only overwrite if the literal part has text content
          ms.overwrite(part.start, part.end, minParts[index]);
        }
      });
    }
  });

  const sourceMin = ms.toString();
  if (source === sourceMin) {
    return null;
  } else {
    let map: SourceMap | undefined;
    if (options.generateSourceMap !== false) {
      const generateSourceMap =
        options.generateSourceMap || defaultGenerateSourceMap;
      map = generateSourceMap(ms, options.fileName || '');
    }

    return {
      map,
      code: sourceMin,
    };
  }
}
