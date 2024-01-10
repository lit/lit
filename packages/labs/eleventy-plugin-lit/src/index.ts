/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as path from 'path';
import {pathToFileURL} from 'url';
import {Worker} from 'worker_threads';
import type {Message} from './worker/types.js';

type LitPluginOptions = {
  componentModules?: string[];
  mode?: 'vm' | 'worker';
};

function configureWorker(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  eleventyConfig: any,
  resolvedComponentModules: string[]
) {
  let worker: Worker;

  const requestIdResolveMap = new Map<number, Function>();
  let requestId = 0;

  eleventyConfig.on('eleventy.before', async () => {
    worker = new Worker(path.resolve(__dirname, './worker/worker.js'));

    worker.on('error', (err) => {
      console.error(
        'Unexpected error while rendering lit component in worker thread',
        err
      );
      throw err;
    });

    let requestResolve: (value?: unknown) => void;
    const requestPromise = new Promise((resolve) => {
      requestResolve = resolve;
    });

    worker.on('message', (message: Message) => {
      switch (message.type) {
        case 'initialize-response': {
          requestResolve();
          break;
        }

        case 'render-response': {
          const {id, rendered} = message;
          const resolve = requestIdResolveMap.get(id);
          if (resolve === undefined) {
            throw new Error(
              '@lit-labs/eleventy-plugin-lit received invalid render-response message'
            );
          }
          resolve(rendered);
          requestIdResolveMap.delete(id);
          break;
        }
      }
    });

    const message: Message = {
      type: 'initialize-request',
      imports: resolvedComponentModules,
    };

    worker.postMessage(message);
    await requestPromise;
  });

  eleventyConfig.on('eleventy.after', async () => {
    await worker.terminate();
  });

  eleventyConfig.addTransform(
    'render-lit',
    async (content: string, outputPath: string | false) => {
      if (outputPath && !outputPath.endsWith('.html')) {
        return content;
      }

      const renderedContent: string = await new Promise((resolve) => {
        requestIdResolveMap.set(requestId, resolve);
        const message: Message = {
          type: 'render-request',
          id: requestId++,
          content,
        };
        worker.postMessage(message);
      });

      const outerMarkersTrimmed = trimOuterMarkers(renderedContent);
      return outerMarkersTrimmed;
    }
  );
}

function configureVm(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  eleventyConfig: any,
  resolvedComponentModules: string[]
) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  if (require('vm').Module === undefined) {
    // Show a more friendly error message if the --experimental-vm-modules
    // flag is missing.
    const red = '\u001b[31m';
    const yellow = '\u001b[33m';
    const reset = '\u001b[0m';
    console.error(
      `${yellow}
┌─────────────────────${red} ERROR ${yellow}─────────────────────┐
│${reset}                                                 ${yellow}│
│${reset} @lit-labs/eleventy-plugin-lit requires Node     ${yellow}│
│${reset} version 12.16.0 or higher, and that eleventy is ${yellow}│
│${reset} launched with a special environment variable    ${yellow}│
│${reset} to enable an experimental feature:              ${yellow}│
│${reset}                                                 ${yellow}│
│${reset} NODE_OPTIONS=--experimental-vm-modules eleventy ${yellow}│
│${reset}                                                 ${yellow}│
└─────────────────────────────────────────────────┘
${reset}`
    );
    throw new Error(
      '@lit-labs/eleventy-plugin-lit requires that eleventy be launched ' +
        'with NODE_OPTIONS=--experimental-vm-modules'
    );
  }

  const renderModulePath = path.join(process.cwd(), 'arbitrary.js');
  let contextifiedRender: (value: unknown) => IterableIterator<string>;
  let contextifiedUnsafeHTML: (value: string) => unknown;

  // Create a fresh context before each build, so that our module cache resets
  // on every --watch mode build.

  // TODO(aomarks) For better performance, we could re-use contexts between
  // build, but selectively invalidate its cache so that only the user's
  // modules are reloaded.
  eleventyConfig.on('eleventy.before', async () => {
    // Note this file must be CommonJS for compatibility with Eleventy, but
    // TypeScript's CommonJS output mode will also convert dynamic import()
    // calls to require() calls. That would be bad, because we need
    // to import ES modules from @lit-labs/ssr, which requires preserved
    // import() calls.
    // So we use eval(`import()`) instead
    //
    // See https://github.com/microsoft/TypeScript/issues/43329 for details
    const {getWindow} = (await eval(
      `import('@lit-labs/ssr/lib/dom-shim.js')`
    )) as typeof import('@lit-labs/ssr/lib/dom-shim.js');
    const {ModuleLoader} = (await eval(
      `import('@lit-labs/ssr/lib/module-loader.js')`
    )) as typeof import('@lit-labs/ssr/lib/module-loader.js');
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
    // instead of doing so via the unsafeHTML directive. The directive is
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
    async (content: string, outputPath: string | false) => {
      if (outputPath && !outputPath.endsWith('.html')) {
        return content;
      }

      // TODO(aomarks) Maybe we should provide a `renderUnsafeHtml` function
      // directly from SSR which does this.
      const iterator = contextifiedRender(contextifiedUnsafeHTML(content));
      const concatenated = iterableToString(iterator);

      const outerMarkersTrimmed = trimOuterMarkers(concatenated);
      return outerMarkersTrimmed;
    }
  );
}

module.exports = {
  configFunction: function (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    eleventyConfig: any,
    {componentModules, mode = 'worker'}: LitPluginOptions = {}
  ) {
    if (componentModules === undefined || componentModules.length === 0) {
      // If there are no component modules, we could never have anything to
      // render.
      return;
    }

    const resolvedComponentModules = componentModules.map(
      (module) => pathToFileURL(path.resolve(process.cwd(), module)).href
    );

    switch (mode) {
      case 'worker': {
        configureWorker(eleventyConfig, resolvedComponentModules);
        break;
      }
      case 'vm': {
        configureVm(eleventyConfig, resolvedComponentModules);
        break;
      }
      default: {
        throw new Error(
          'Invalid mode provided for @lit-labs/eleventy-plugin-lit'
        );
      }
    }
  },
};

// Lit SSR includes comment markers to track the outer template from
// the template we've generated here, but it's not possible for this
// outer template to be hydrated, so they serve no purpose.

// TODO(aomarks) Maybe we should provide an option to SSR option to skip
// outer markers (though note there are 2 layers of markers due to the
// use of the unsafeHTML directive).
function trimOuterMarkers(renderedContent: string): string {
  return renderedContent
    .replace(/^((<!--[^<>]*-->)|(<\?>)|\s)+/, '')
    .replace(/((<!--[^<>]*-->)|(<\?>)|\s)+$/, '');
}

// Assuming this is faster than Array.from(iter).join();
// TODO: perf test
const iterableToString = (iterable: Iterable<string>) => {
  let s = '';
  for (const i of iterable) {
    s += i;
  }
  return s;
};
