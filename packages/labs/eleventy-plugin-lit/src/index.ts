/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

// Note this file must be CommonJS for compatibility with Eleventy, but we can't
// rely on TypeScript's CommonJS output mode, because that will also convert
// dynamic import() calls to require() calls. That would be bad, because we need
// to import ES modules from @lit-labs/ssr, which requires preserved import()
// calls.
//
// So instead we use TypeScript's ESM output mode, but explicitly write
// require() calls for the CommonJS modules we import.
//
// See https://github.com/microsoft/TypeScript/issues/43329 and
// https://github.com/microsoft/TypeScript#22321 for more details.

// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path') as typeof import('path');

type LitPluginOptions = {
  componentModules?: string[];
};

module.exports = {
  configFunction: function (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    eleventyConfig: any,
    {componentModules}: LitPluginOptions = {}
  ) {
    if (componentModules === undefined || componentModules.length === 0) {
      // If there are no component modules, we could never have anything to
      // render.
      return;
    }

    const renderModulePath = path.join(process.cwd(), 'arbitrary.js');
    const resolvedComponentModules = componentModules.map((module) =>
      path.resolve(process.cwd(), module)
    );

    let contextifiedRender: (value: unknown) => IterableIterator<string>;
    let contextifiedUnsafeHTML: (value: string) => unknown;

    // Create a fresh context before each build, so that our module cache resets
    // on every --watch mode build.

    // TODO(aomarks) For better performance, we could re-use contexts between
    // build, but selectively invalidate its cache so that only the user's
    // modules are reloaded.
    eleventyConfig.on('eleventy.before', async () => {
      const {getWindow} = await import('@lit-labs/ssr/lib/dom-shim.js');
      const {ModuleLoader} = await import('@lit-labs/ssr/lib/module-loader.js');
      const window = getWindow({includeJSBuiltIns: true});
      const loader = new ModuleLoader({global: window});
      await Promise.all(
        resolvedComponentModules.map((module) =>
          loader.importModule(module, renderModulePath)
        )
      );
      contextifiedRender = (
        await loader.importModule(
          '@lit-labs/ssr/lib/render-lit-html.js',
          renderModulePath
        )
      ).module.namespace.render as typeof contextifiedRender;
      // TOOD(aomarks) We could also directly synthesize an html TemplateResult
      // instead of doing so via the the unsafeHTML directive. The directive is
      // performing some extra validation that doesn't really apply to us.
      contextifiedUnsafeHTML = (
        await loader.importModule(
          'lit/directives/unsafe-html.js',
          renderModulePath
        )
      ).module.namespace.unsafeHTML as typeof contextifiedUnsafeHTML;
    });

    eleventyConfig.addTransform(
      'render-lit',
      async (content: string, outputPath: string) => {
        if (!outputPath.endsWith('.html')) {
          return content;
        }
        // TODO(aomarks) Maybe we should provide a `renderUnsafeHtml` function
        // directly from SSR which does this.
        const iterator = contextifiedRender(contextifiedUnsafeHTML(content));
        const concatenated = iterableToString(iterator);
        // Lit SSR includes comment markers to track the outer template from
        // the template we've generated here, but it's not possible for this
        // outer template to be hydrated, so they serve no purpose.

        // TODO(aomarks) Maybe we should provide an option to SSR option to skip
        // outer markers (though note there are 2 layers of markers due to the
        // use of the unsafeHTML directive).
        const outerMarkersTrimmed = concatenated
          .replace(/^((<!--[^<>]*-->)|(<\?>)|\s)+/, '')
          .replace(/((<!--[^<>]*-->)|(<\?>)|\s)+$/, '');
        return outerMarkersTrimmed;
      }
    );
  },
};

// Assuming this is faster than Array.from(iter).join();
// TODO: perf test
const iterableToString = (iterable: Iterable<string>) => {
  let s = '';
  for (const i of iterable) {
    s += i;
  }
  return s;
};
