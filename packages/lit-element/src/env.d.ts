/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

// eslint-disable-next-line no-var
declare var litElementHydrateSupport:
  | undefined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | ((options: {LitElement: any}) => void);

// Note, define both DEV_MODE and prod versions of this since this file is not
// built.
// eslint-disable-next-line no-var
declare var litElementPolyfillSupport:
  | undefined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | ((options: {LitElement: any}) => void);
// eslint-disable-next-line no-var
declare var litElementPolyfillSupportDevMode: typeof litElementPolyfillSupport;

// eslint-disable-next-line no-var
declare var litElementVersions: undefined | Array<string>;
// eslint-disable-next-line no-var
declare var litIssuedWarnings: undefined | Set<string | undefined>;
