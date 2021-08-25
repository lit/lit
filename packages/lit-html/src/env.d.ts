/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

// eslint-disable-next-line no-var
declare var litHtmlPlatformSupport:
  | undefined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | (((template: any, childPart: any) => void) & {noPatchSupported?: boolean});
// eslint-disable-next-line no-var
declare var litHtmlVersions: undefined | Array<string>;
