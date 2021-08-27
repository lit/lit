/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {TemplateResult} from 'lit';

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
    html: SSRExpectedHTML;

    setup?(assert: Chai.Assert, dom: HTMLElement): void | Promise<unknown>;
    check?(assert: Chai.Assert, dom: HTMLElement): void | Promise<unknown>;
  }>;
  /**
   * A list of selectors of elements that should no change between renders.
   * Used to assert that the DOM reused in hydration, not recreated.
   */
  stableSelectors: Array<string>;
  expectMutationsOnFirstRender?: boolean;
  expectMutationsDuringHydration?: boolean;
  expectMutationsDuringUpgrade?: boolean;
  skip?: boolean;
  only?: boolean;
  registerElements?(): void | Promise<unknown>;
}

export type SSRTestFactory = () => SSRTestDescription;

export type SSRTest = SSRTestDescription | SSRTestFactory;

export type SSRTestSuite = {[name: string]: SSRTest};
