/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * lit-html patch to support a lightweight web components shim for
 * custom elements and shadow dom slot distribution.
 *
 * Creating scoped CSS is not covered by this module. It is, however, integrated
 * into the lit-element and @lit/reactive-element packages. See the ShadyCSS docs
 * for how to apply scoping to CSS:
 * https://github.com/webcomponents/polyfills/tree/master/packages/shadycss#usage.
 *
 * @packageDocumentation
 */

// IMPORTANT: these imports must be type-only
import type {DirectiveResult} from './directive.js';

// Note, explicitly use `var` here so that this can be re-defined when
// bundled.
// eslint-disable-next-line no-var
var DEV_MODE = true;

const ELEMENT_PART = 6;

type ElementTemplatePart = {
  readonly type: typeof ELEMENT_PART;
  readonly index: number;
  value?: DirectiveResult;
};

interface PatchableTemplate {
  el: HTMLTemplateElement;
}

interface PatchableTemplateConstructor {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-misused-new
  new (...args: any[]): PatchableTemplate;
}

export const ElementPartProcessors = new Set<
  (el: Element) => DirectiveResult | void
>();

/**
 */
const polyfillSupport: NonNullable<typeof litHtmlPolyfillSupport> = (
  Template: PatchableTemplateConstructor
) => {
  Template.prototype.elementPartCallback = function (
    element: Element,
    index: number
  ): ElementTemplatePart[] | undefined {
    for (const processor of ElementPartProcessors) {
      const value = processor(element);
      if (value !== undefined) {
        return [
          {
            type: ELEMENT_PART,
            index,
            value,
          },
        ];
      }
    }
    return undefined;
  };

  const baseGetTemplateInfo = Template.prototype.getTemplateInfo;
  Template.prototype.getTemplateInfo = function (
    strings: TemplateStringsArray,
    type: unknown,
    options: unknown
  ) {
    const [el, attrNames, partCount] = baseGetTemplateInfo.call(
      this,
      strings,
      type,
      options
    );
    // TODO: add these parts for reals?
    const ceCount = Array.from(el.content.querySelectorAll('*')).filter((n) =>
      (n as Element).localName.includes('-')
    ).length;
    return [el, attrNames, partCount + ceCount];
  };
};

if (DEV_MODE) {
  globalThis.litHtmlPolyfillSupportDevMode ??= polyfillSupport;
} else {
  globalThis.litHtmlPolyfillSupport ??= polyfillSupport;
}
