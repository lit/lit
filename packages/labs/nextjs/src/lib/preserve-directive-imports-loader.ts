/**
 * A webpack-compatible loader (also accepted by Turbopack) that prepends
 * side-effectful imports to a module, but inserts them *after* any leading
 * React Server Components directive (`'use client'` / `'use server'`).
 *
 * `imports-loader` always prepends imports at the top of the file. Under
 * webpack this is fine because Next.js extracts RSC directives in a separate
 * pre-pass before loaders run. Under Turbopack, however, loaders run first
 * and the directive must remain the very first statement of the module — so
 * any import prepended ahead of it disables the directive and breaks the
 * client/server boundary detection.
 *
 * This loader handles both cases by preserving the directive position.
 */

interface LoaderOptions {
  imports: ReadonlyArray<string>;
  /**
   * When `true`, only inject into `'use client'` modules. Used to install
   * hydration support in every client component so it runs before any Lit
   * element they import, regardless of Turbopack's module evaluation order.
   */
  clientOnly?: boolean;
}

interface LoaderThis {
  getOptions(): LoaderOptions;
  cacheable?(flag?: boolean): void;
}

/**
 * Matches a leading RSC directive, allowing for shebangs, BOM, comments, and
 * whitespace before it (per the directive-prologue spec). Capture group 1 is
 * the directive kind (`client` or `server`).
 */
const directiveRegex =
  /^(?:\uFEFF)?(?:#![^\n]*\n)?(?:\s|\/\/[^\n]*\n|\/\*[\s\S]*?\*\/)*['"]use (client|server)['"]\s*;?[^\n]*\n?/;

function loader(this: LoaderThis, source: string): string {
  this.cacheable?.(true);
  const {imports, clientOnly} = this.getOptions();
  if (!imports || imports.length === 0) {
    return source;
  }
  const match = source.match(directiveRegex);
  if (clientOnly && match?.[1] !== 'client') {
    return source;
  }
  const importStatements =
    imports.map((spec) => `import ${JSON.stringify(spec)};`).join('\n') + '\n';
  if (match) {
    const directive = match[0];
    return directive + importStatements + source.slice(directive.length);
  }
  return importStatements + source;
}

export = loader;
