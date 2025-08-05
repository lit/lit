/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * This is a limited implemenation of the observer family of classes.
 */

type MutationObserverInterface = MutationObserver;

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
 */
const MutationObserverShim = class MutationObserver
  implements MutationObserverInterface
{
  constructor(_callback: MutationCallback) {}
  disconnect(): void {}
  observe(_target: Node, _options?: MutationObserverInit): void {}
  takeRecords(): MutationRecord[] {
    return [];
  }
};
const MutationObserverShimWithRealType =
  MutationObserverShim as object as typeof MutationObserver;
export {MutationObserverShimWithRealType as MutationObserver};

type ResizeObserverInterface = ResizeObserver;

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver
 */
const ResizeObserverShim = class ResizeObserver
  implements ResizeObserverInterface
{
  constructor(_callback: ResizeObserverCallback) {}
  disconnect(): void {}
  observe(_target: Element, _options?: ResizeObserverOptions): void {}
  unobserve(_target: Element): void {}
};
const ResizeObserverShimWithRealType =
  ResizeObserverShim as object as typeof ResizeObserver;
export {ResizeObserverShimWithRealType as ResizeObserver};

type IntersectionObserverInterface = IntersectionObserver;

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver
 */
const IntersectionObserverShim = class IntersectionObserver
  implements IntersectionObserverInterface
{
  constructor(
    _callback: IntersectionObserverCallback,
    private __options?: IntersectionObserverInit
  ) {}
  get root(): Element | Document | null {
    return this.__options?.root ?? null;
  }
  get rootMargin(): string {
    return this.__options?.rootMargin ?? '0px 0px 0px 0px';
  }
  get thresholds(): readonly number[] {
    return Array.isArray(this.__options?.threshold)
      ? this.__options.threshold
      : [this.__options?.threshold ?? 0];
  }
  disconnect(): void {}
  observe(_target: Element): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
  unobserve(_target: Element): void {}
};
const IntersectionObserverShimWithRealType =
  IntersectionObserverShim as object as typeof IntersectionObserver;
export {IntersectionObserverShimWithRealType as IntersectionObserver};
