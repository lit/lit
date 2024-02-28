/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

export type MessageFromWebviewToExtension = {
  kind: 'focus-source-at-location';
  filename: string;
  line: number;
  column: number;
};
