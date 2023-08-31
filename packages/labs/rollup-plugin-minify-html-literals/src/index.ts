import {Plugin, SourceDescription, TransformHook, PluginContext} from 'rollup';
import {createFilter} from 'rollup-pluginutils';
import * as minify from './lib/minify-html-literals.js';

/**
 * Plugin options.
 */
export interface Options {
  /**
   * Pattern or array of patterns of files to minify.
   */
  include?: string | string[];
  /**
   * Pattern or array of patterns of files not to minify.
   */
  exclude?: string | string[];
  /**
   * Minify options, see
   * https://www.npmjs.com/package/minify-html-literals#options.
   */
  options?: Partial<minify.Options>;
  /**
   * If true, any errors while parsing or minifying will abort the bundle
   * process. Defaults to false, which will only show a warning.
   */
  failOnError?: boolean;
  /**
   * Override minify-html-literals function.
   */
  minifyHTMLLiterals?: typeof minify.minifyHTMLLiterals;
  /**
   * Override include/exclude filter.
   */
  filter?: (id: string) => boolean;
}

export default function (
  options: Options = {}
): Plugin & {transform: TransformHook} {
  if (!options.minifyHTMLLiterals) {
    options.minifyHTMLLiterals = minify.minifyHTMLLiterals;
  }

  if (!options.filter) {
    options.filter = createFilter(options.include, options.exclude);
  }

  const minifyOptions = <minify.DefaultOptions>options.options || {};

  return {
    name: 'minify-html-literals',
    transform(this: PluginContext, code: string, id: string) {
      if (options.filter!(id)) {
        try {
          return <SourceDescription>options.minifyHTMLLiterals!(code, {
            ...minifyOptions,
            fileName: id,
          });
        } catch (error) {
          // check if Error else treat as string
          const message =
            error instanceof Error ? error.message : (error as string);

          if (options.failOnError) {
            this.error(message);
          } else {
            this.warn(message);
          }
        }
      }
      return;
    },
  };
}
