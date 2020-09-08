/**
 * @license
 * Copyright (c) 2020 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt The complete set of authors may be found
 * at http://polymer.github.io/AUTHORS.txt The complete set of contributors may
 * be found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by
 * Google as part of the polymer project is also subject to an additional IP
 * rights grant found at http://polymer.github.io/PATENTS.txt
 */

module.exports = (config) => {
  config.set({
    files: [{pattern: 'lib_client/**/*.test.js', type: 'module'}],
    plugins: [
      require('@open-wc/karma-esm'),
      require('karma-chai'),
      require('karma-chrome-launcher'),
      require('karma-mocha'),
      require('karma-mocha-reporter'),
    ],
    frameworks: ['esm', 'mocha', 'chai'],
    esm: {
      nodeResolve: true,
    },
    client: {
      mocha: {
        reporter: 'html',
        ui: 'tdd',
      },
    },
    browsers: ['ChromeHeadless'],
    reporters: ['mocha'],
  });
};
