/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

declare module 'deoptigate/app/lib/create-page.js' {
  export default function createPage(): string;
}
declare module 'deoptigate/deoptigate.log.js' {
  export function logToJSON(
    path: string,
    options: {root: string}
  ): Promise<string>;
}
