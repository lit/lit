/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

// eslint-disable-next-line no-var
declare var reactiveElementPlatformSupport:
  | undefined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | ((options: {ReactiveElement: any}) => void);
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
