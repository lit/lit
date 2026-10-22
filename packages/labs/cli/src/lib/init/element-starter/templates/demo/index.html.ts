/**
 * @license
 * Copyright The Lit Project Contributors.
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {FileTree} from '@oicl-lit/gen-utils/lib/file-utils.js';
import {html} from '@oicl-lit/gen-utils/lib/str-utils.js';

export const generateIndex = (elementName: string): FileTree => {
  return {
    demo: {
      'index.html': html`<!DOCTYPE html>
<html lang="en">
  <head>
    <title>${elementName} demo</title>
    <script type="module" src="../lib/${elementName}.js"></script>
  </head>
  <body>
    <${elementName}></${elementName}>
  </body>
</html>`,
    },
  };
};
