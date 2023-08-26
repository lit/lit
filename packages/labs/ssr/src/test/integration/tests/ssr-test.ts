/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import type {TemplateResult} from 'lit';
import type {RenderInfo} from '../../../lib/render-lit-html.js';

export type SSRExpectedHTML =
  | string
  | {[name: string]: SSRExpectedHTML | SSRExpectedHTML[]};

export interface SSRTestDescription {
  render(...args: any): TemplateResult;
  expectations: Array<{
    /**
     * The arguments to pass to render()
     */
    args: Array<unknown>;

    /**
     * The expected HTML string.
     *
     * Does not need to contain lit-html marker comments.
     */
    html: SSRExpectedHTMLGroup | SSRExpectedHTML;

    setup?(assert: Chai.Assert, dom: HTMLElement): void | Promise<unknown>;
    check?(assert: Chai.Assert, dom: HTMLElement): void | Promise<unknown>;
  }>;
  /**
   * A list of selectors of elements that should not change between renders.
   * Used to assert that the DOM was reused in hydration, not recreated.
   */
  stableSelectors: Array<string>;
  expectMutationsOnFirstRender?: boolean;
  expectMutationsDuringHydration?: boolean;
  expectMutationsDuringUpgrade?: boolean;
  skipPreHydrationAssertHtml?: boolean;
  skip?: boolean;
  only?: boolean;
  registerElements?(): void | Promise<unknown>;
  serverRenderOptions?: Partial<RenderInfo>;
}

export type SSRTestFactory = () => SSRTestDescription;

export type SSRTest = SSRTestDescription | SSRTestFactory;

export type SSRTestSuite = {[name: string]: SSRTest};

export type SSRExpectedHTMLGroup = {
  match: 'any';
  expectations: Array<SSRExpectedHTML>;
};

export const anyHtml = (
  expectations: Array<SSRExpectedHTML>
): SSRExpectedHTMLGroup => ({
  match: 'any',
  expectations,
});

export const isAnyHtml = (
  html: SSRExpectedHTMLGroup | SSRExpectedHTML
): html is SSRExpectedHTMLGroup => html.match === 'any';
