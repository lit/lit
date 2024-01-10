/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

// Note, define both DEV_MODE and prod versions of this since this file is not
// built.
// eslint-disable-next-line no-var
declare var reactiveElementPolyfillSupport:
  | undefined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | ((options: {ReactiveElement: any}) => void);
// eslint-disable-next-line no-var
declare var reactiveElementPolyfillSupportDevMode: typeof reactiveElementPolyfillSupport;

// eslint-disable-next-line no-var
declare var reactiveElementVersions: undefined | Array<string>;

// eslint-disable-next-line no-var
declare var litIssuedWarnings: undefined | Set<string | undefined>;

// Augment existing types with styling API
interface ShadowRoot {
  adoptedStyleSheets: CSSStyleSheet[];
}

interface CSSStyleSheet {
  replaceSync(cssText: string): void;
}
