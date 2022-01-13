/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

// Note, define both DEV_MODE and prod versions of this since this file is not
// built.
// eslint-disable-next-line no-var
declare var litHtmlPolyfillSupport:
  | undefined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | (((template: any, childPart: any) => void) & {noPatchSupported?: boolean});
// eslint-disable-next-line no-var
declare var litHtmlPolyfillSupportDevMode: typeof litHtmlPolyfillSupport;

// eslint-disable-next-line no-var
declare var litHtmlVersions: undefined | Array<string>;
// eslint-disable-next-line no-var
declare var litIssuedWarnings: undefined | Set<string | undefined>;
