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

// Augment existing types with styling API
interface ShadowRoot {
  adoptedStyleSheets: CSSStyleSheet[];
}

interface CSSStyleSheet {
  replaceSync(cssText: string): void;
}
