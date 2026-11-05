import {
  MinifierOptions as HTMLMinifierOptions,
  minify,
} from 'html-minifier-next';
import {transform, type TransformOptions} from 'lightningcss';
import {TemplatePart} from './models.js';

/**
 * Allowed LightningCSS options that can be passed through.
 * We exclude options that don't make sense for string-to-string transformation.
 */
export type CSSMinifierOptions = Omit<
  TransformOptions<{}>,
  'filename' | 'code' | 'sourceMap' | 'inputSourceMap' | 'projectRoot'
>;

/**
 * A strategy on how to minify HTML and optionally CSS.
 *
 * @template O minify HTML options
 * @template C minify CSS options
 */
export interface Strategy<O = unknown, C = unknown> {
  /**
   * Retrieve a placeholder for the given array of template parts. The
   * placeholder returned should be the same if the function is invoked with the
   * same array of parts.
   *
   * The placeholder should be an HTML-compliant string that is not present in
   * any of the parts' text.
   *
   * @param parts the parts to get a placeholder for
   * @returns the placeholder
   */
  getPlaceholder(parts: TemplatePart[]): string;
  /**
   * Combines the parts' HTML text strings together into a single string using
   * the provided placeholder. The placeholder indicates where a template
   * expression occurs.
   *
   * @param parts the parts to combine
   * @param placeholder the placeholder to use between parts
   * @returns the combined parts' text strings
   */
  combineHTMLStrings(parts: TemplatePart[], placeholder: string): string;
  /**
   * Minfies the provided HTML string.
   *
   * @param html the html to minify
   * @param options html minify options
   * @returns minified HTML string
   */
  minifyHTML(html: string, options?: O): string | Promise<string>;
  /**
   * Minifies the provided CSS string.
   *
   * @param css the css to minfiy
   * @param options css minify options
   * @returns minified CSS string
   */
  minifyCSS?(css: string, options?: C): string;
  /**
   * Splits a minfied HTML string back into an array of strings from the
   * provided placeholder. The returned array of strings should be the same
   * length as the template parts that were combined to make the HTML string.
   *
   * @param html the html string to split
   * @param placeholder the placeholder to split by
   * @returns an array of html strings
   */
  splitHTMLByPlaceholder(html: string, placeholder: string): string[];
}

/**
 * The default LightningCSS options, optimized for production minification.
 */
export const defaultMinifyCSSOptions: CSSMinifierOptions = {
  minify: true,
};

/**
 * The default <code>html-minifier</code> options, optimized for production
 * minification.
 */
export const defaultMinifyOptions: HTMLMinifierOptions & {
  minifyCSS: CSSMinifierOptions | false;
} = {
  caseSensitive: true,
  collapseWhitespace: true,
  decodeEntities: true,
  minifyCSS: defaultMinifyCSSOptions,
  minifyJS: true,
  processConditionalComments: true,
  removeAttributeQuotes: false,
  removeComments: true,
  removeEmptyAttributes: true,
  removeScriptTypeAttributes: true,
  removeStyleLinkTypeAttributes: true,
  useShortDoctype: true,
};

/**
 * The default strategy. This uses <code>html-minifier</code> to minify HTML and
 * <code>lightningcss</code> to minify CSS.
 */
export const defaultStrategy: Strategy<
  HTMLMinifierOptions,
  CSSMinifierOptions
> = {
  getPlaceholder(parts) {
    // Using @TEMPLATE_EXPRESSION(); as a unified placeholder that works in both
    // HTML and as a CSS at-rule. The semicolon may be removed by CSS minifiers,
    // which is handled in splitHTMLByPlaceholder().
    const suffix = '();';
    let placeholder = '@TEMPLATE_EXPRESSION';
    while (parts.some((part) => part.text.includes(placeholder + suffix))) {
      placeholder += '_';
    }

    return placeholder + suffix;
  },
  combineHTMLStrings(parts, placeholder) {
    return parts.map((part) => part.text).join(placeholder);
  },
  async minifyHTML(html, options = {}) {
    let minifyCSSOptions: HTMLMinifierOptions['minifyCSS'];
    if (options.minifyCSS) {
      if (
        options.minifyCSS !== true &&
        typeof options.minifyCSS !== 'function'
      ) {
        minifyCSSOptions = {...options.minifyCSS};
      } else {
        minifyCSSOptions = {};
      }
    } else {
      minifyCSSOptions = false;
    }

    // Apply the same placeholder transformation for CSS property values
    // This ensures @TEMPLATE_EXPRESSION(); in CSS property values is converted
    // to __TEMPLATE_EXPRESSION__ so LightningCSS treats it as an identifier
    // rather than trying to parse it as an at-rule.
    const placeholderRegex = /:\s*(@TEMPLATE_EXPRESSION_*)\(\);/g;
    html = html.replace(placeholderRegex, (match, id) => {
      const prefix = match.substring(0, match.indexOf('@'));
      return prefix + id.replace('@', '__') + '__';
    });

    let result = await minify(html, {
      ...options,
      minifyCSS: minifyCSSOptions,
    });

    // Restore placeholders after minification
    result = result.replace(/__TEMPLATE_EXPRESSION_*__/g, (match) => {
      return match.replace(/^__/, '@').replace(/__$/, '();');
    });

    if (options.collapseWhitespace) {
      // html-minifier does not support removing newlines inside <svg>
      // attributes. Support this, but be careful not to remove newlines from
      // supported areas (such as within <pre> and <textarea> tags).
      const matches = Array.from(result.matchAll(/<svg/g)).reverse();
      for (const match of matches) {
        const startTagIndex = match.index!;
        const closeTagIndex = result.indexOf('</svg', startTagIndex);
        if (closeTagIndex < 0) {
          // Malformed SVG without a closing tag
          continue;
        }

        const start = result.substring(0, startTagIndex);
        let svg = result.substring(startTagIndex, closeTagIndex);
        const end = result.substring(closeTagIndex);
        svg = svg.replace(/\r?\n/g, '');
        result = start + svg + end;
      }
    }

    return result;
  },
  minifyCSS(css, options = {}) {
    // LightningCSS will parse @TEMPLATE_EXPRESSION(); as an at-rule, which
    // causes it to strip the semicolon after it in CSS property values.
    // To work around this, we replace the placeholder with an identifier which
    // LightningCSS will parse as a property value.
    const placeholderRegex = /:\s*(@TEMPLATE_EXPRESSION_*)\(\);/g;
    css = css.replace(placeholderRegex, (match, id) => {
      const prefix = match.substring(0, match.indexOf('@'));
      return prefix + id.replace('@', '__') + '__';
    });

    try {
      const result = transform({
        filename: 'style.css', // Placeholder filename
        code: new Uint8Array(Buffer.from(css)),
        minify: true,
        ...options,
      });
      let code = result.code.toString();
      // Restore placeholders
      code = code.replace(/__TEMPLATE_EXPRESSION_*__/g, (match) => {
        return match.replace(/^__/, '@').replace(/__$/, '();');
      });
      return code;
    } catch (error) {
      throw new Error(
        `LightningCSS error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },
  splitHTMLByPlaceholder(html, placeholder) {
    let parts = html.split(placeholder);
    let activePlaceholder = placeholder;

    // LightningCSS may add a space before parentheses in at-rules
    // Try splitting with a space-modified version if we don't have enough parts
    if (placeholder.includes('()') && parts.length === 1) {
      const withSpace = placeholder.replace('()', ' ()');
      const spaceParts = html.split(withSpace);
      if (spaceParts.length > 1) {
        parts = spaceParts;
        activePlaceholder = withSpace;
      }
    }

    // Make the last character (a semicolon) optional for cases where
    // the CSS minifier removes it (e.g., last property before closing brace).
    // This handles: @TEMPLATE_EXPRESSION(); and @TEMPLATE_EXPRESSION() (without semicolon)
    if (activePlaceholder.endsWith(';')) {
      const withoutSemicolon = activePlaceholder.substring(
        0,
        activePlaceholder.length - 1
      );
      for (let i = parts.length - 1; i >= 0; i--) {
        parts.splice(i, 1, ...parts[i].split(withoutSemicolon));
      }
    }

    return parts;
  },
};
