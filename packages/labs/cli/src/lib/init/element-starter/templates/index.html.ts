import {FileTree} from '@lit-labs/gen-utils/lib/file-utils.js';
import {html} from '@lit-labs/gen-utils/lib/str-utils.js';

export const generateIndex = (elementName: string): FileTree => {
  return {
    'index.html': html`<!DOCTYPE html>
<!--
@license
Copyright 2022 Google LLC
SPDX-License-Identifier: BSD-3-Clause
-->
<html lang="en">
  <head>
    <title>My Lit Element</title>
    <script type="module" src="./lib/${elementName}.js"></script>
  </head>
  <body>
    <${elementName}></${elementName}>
  </body>
</html>`,
  };
};
