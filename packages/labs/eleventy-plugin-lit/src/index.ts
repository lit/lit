/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');

type LitPluginOptions = {
  componentModules?: string[];
};

module.exports = {
  configFunction: function (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    eleventyConfig: any,
    options: LitPluginOptions = {}
  ) {
    eleventyConfig.addTransform(
      'render-lit',
      async (content: string, outputPath: string) => {
        console.log(this);
        if (outputPath.endsWith('.html')) {
          const render = (
            await import('@lit-labs/ssr/lib/render-with-global-dom-shim.js')
          ).render;
          const html = (await import('lit')).html;
          const unsafeHTML = (await import('lit/directives/unsafe-html.js'))
            .unsafeHTML;
          for (const module of options.componentModules ?? []) {
            require(path.join(process.cwd(), module));
          }
          let head, body, tail;
          const page = content.match(/(.*)(<body.*<\/body>)(.*)/);
          if (page) {
            [head, body, tail] = page;
          } else {
            head = `<html><head></head>`;
            body = `<body>${content}</body>`;
            tail = `</html>`;
          }
          return (
            head + iterableToString(render(html`${unsafeHTML(body)}`)) + tail
          );
        }
        return content;
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
