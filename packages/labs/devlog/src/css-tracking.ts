/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {CSSResult} from 'lit';

export function* findElementsMatching(href: string, selectorText: string) {
  for (const style of CSSResult.getStylesByHref?.(href) ?? []) {
    console.log(style.adoptedInto);
    for (const shadowRootRef of style.adoptedInto ?? []) {
      const shadowRoot = shadowRootRef.deref();
      if (shadowRoot == null) {
        continue;
      }
      if (selectorText.trim() === ':host') {
        yield shadowRoot.host;
      } else {
        yield* shadowRoot.querySelectorAll(selectorText);
      }
    }
  }
}

setTimeout(() => {
  const elems = findElementsMatching(
    new URL(
      '/unmappedjs/javascript/lit/example/components/example_widget/example-widget.css.js',
      window.location.href
    ).href,
    '.on'
  );
  for (const element of elems) {
    console.log(element);
  }
}, 0);
