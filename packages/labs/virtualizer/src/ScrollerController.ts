/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ScrollToCoordinates} from './layouts/shared/Layout.js';

type retargetScrollCallback = () => ScrollToCoordinates;
type endScrollCallback = () => void;
type Nullable<T> = T | null;

export class ScrollerShim {
  protected _node: Element | Window;
  protected _element: Nullable<Element> = null;

  constructor(element?: Element) {
    const node = element ?? window;
    this._node = node;
    if (element) {
      this._element = element;
    }
  }

  public get element() {
    return (
      this._element || document.scrollingElement || document.documentElement
    );
  }

  public get scrollTop() {
    return this.element.scrollTop || window.scrollY;
  }

  public get scrollLeft() {
    return this.element.scrollLeft || window.scrollX;
  }

  public get scrollHeight() {
    return this.element.scrollHeight;
  }

  public get scrollWidth() {
    return this.element.scrollWidth;
  }

  public get viewportHeight() {
    return this._element
      ? this._element.getBoundingClientRect().height
      : window.innerHeight;
  }

  public get viewportWidth() {
    return this._element
      ? this._element.getBoundingClientRect().width
      : window.innerWidth;
  }

  public get maxScrollTop() {
    return this.scrollHeight - this.viewportHeight;
  }

  public get maxScrollLeft() {
    return this.scrollWidth - this.viewportWidth;
  }
}

export class ScrollerController extends ScrollerShim {
  private _originalScrollTo:
    | typeof Element.prototype.scrollTo
    | typeof window.scrollTo;
  private _originalScrollBy:
    | typeof Element.prototype.scrollBy
    | typeof window.scrollBy;
  private _originalScroll:
    | typeof Element.prototype.scroll
    | typeof window.scroll;
  private _clients = new Set<unknown>();
  private _retarget: Nullable<retargetScrollCallback> = null;
  private _end: Nullable<endScrollCallback> = null;
  private __destination: Nullable<ScrollToOptions> = null;

  constructor(client: unknown, element?: Element) {
    super(element);

    this._checkForArrival = this._checkForArrival.bind(this);
    this._updateManagedScrollTo = this._updateManagedScrollTo.bind(this);
    this.scrollTo = this.scrollTo.bind(this);
    this.scrollBy = this.scrollBy.bind(this);

    const node = this._node;

    this._originalScrollTo = node.scrollTo;
    this._originalScrollBy = node.scrollBy;
    this._originalScroll = node.scroll;
    this._attach(client);
  }

  public correctingScrollError = false;

  private get _destination() {
    return this.__destination;
  }

  public get scrolling() {
    return this._destination !== null;
  }

  public scrollTo(options: ScrollToOptions): void;
  public scrollTo(x: number, y: number): void;
  public scrollTo(p1: ScrollToOptions | number, p2?: number): void;
  public scrollTo(p1: ScrollToOptions | number, p2?: number) {
    const options: ScrollToOptions =
      typeof p1 === 'number' && typeof p2 === 'number'
        ? {left: p1, top: p2}
        : (p1 as ScrollToOptions);
    this._scrollTo(options);
  }

  public scrollBy(options: ScrollToOptions): void;
  public scrollBy(x: number, y: number): void;
  public scrollBy(p1: ScrollToOptions | number, p2?: number): void;
  public scrollBy(p1: ScrollToOptions | number, p2?: number) {
    const options: ScrollToOptions =
      typeof p1 === 'number' && typeof p2 === 'number'
        ? {left: p1, top: p2}
        : (p1 as ScrollToOptions);
    if (options.top !== undefined) {
      options.top += this.scrollTop;
    }
    if (options.left !== undefined) {
      options.left += this.scrollLeft;
    }
    this._scrollTo(options);
  }

  private _nativeScrollTo(options: ScrollToOptions) {
    this._originalScrollTo!.bind(this._element || window)(options);
  }

  private _scrollTo(
    options: ScrollToOptions,
    retarget: retargetScrollCallback | null = null,
    end: endScrollCallback | null = null
  ) {
    if (this._end !== null) {
      this._end();
    }
    if (options.behavior === 'smooth') {
      this._setDestination(options);
      this._retarget = retarget;
      this._end = end;
    } else {
      this._resetScrollState();
    }
    this._nativeScrollTo(options);
  }

  private _setDestination(options: ScrollToOptions) {
    let {top, left} = options;
    top =
      top === undefined
        ? undefined
        : Math.max(0, Math.min(top, this.maxScrollTop));
    left =
      left === undefined
        ? undefined
        : Math.max(0, Math.min(left, this.maxScrollLeft));
    if (
      this._destination !== null &&
      left === this._destination.left &&
      top === this._destination.top
    ) {
      return false;
    }
    this.__destination = {top, left, behavior: 'smooth'};
    return true;
  }

  private _resetScrollState() {
    this.__destination = null;
    this._retarget = null;
    this._end = null;
  }

  private _updateManagedScrollTo(coordinates: ScrollToCoordinates) {
    if (this._destination) {
      if (this._setDestination(coordinates)) {
        this._nativeScrollTo(this._destination);
      }
    }
  }

  public managedScrollTo(
    options: ScrollToOptions,
    retarget: retargetScrollCallback,
    end: endScrollCallback
  ) {
    this._scrollTo(options, retarget, end);
    return this._updateManagedScrollTo;
  }

  public correctScrollError(coordinates: ScrollToCoordinates) {
    this.correctingScrollError = true;
    requestAnimationFrame(() =>
      requestAnimationFrame(() => (this.correctingScrollError = false))
    );
    // Correct the error
    this._nativeScrollTo(coordinates);
    // Then, if we were headed for a specific destination, we continue scrolling:
    // First, we update our target destination, if applicable...
    if (this._retarget) {
      this._setDestination(this._retarget());
    }
    // Then we go ahead and resume scrolling
    if (this._destination) {
      this._nativeScrollTo(this._destination);
    }
  }

  private _checkForArrival() {
    if (this._destination !== null) {
      const {scrollTop, scrollLeft} = this;
      let {top, left} = this._destination;
      top = Math.min(top || 0, this.maxScrollTop);
      left = Math.min(left || 0, this.maxScrollLeft);
      const topDiff = Math.abs(top - scrollTop);
      const leftDiff = Math.abs(left - scrollLeft);
      // We check to see if we've arrived at our destination.
      if (topDiff < 1 && leftDiff < 1) {
        if (this._end) {
          this._end();
        }
        this._resetScrollState();
      }
    }
  }

  public detach(client: unknown) {
    this._clients.delete(client);

    /**
     * If there aren't any more clients, then return the node's default
     * scrolling methods
     */
    if (this._clients.size === 0) {
      this._node.scrollTo = this._originalScrollTo;
      this._node.scrollBy = this._originalScrollBy;
      this._node.scroll = this._originalScroll;
      this._node.removeEventListener('scroll', this._checkForArrival);
    }
    return null;
  }

  private _attach(client: unknown) {
    this._clients.add(client);

    /**
     * The node should only have the methods shimmed when adding the first
     * client – otherwise it's redundant
     */
    if (this._clients.size === 1) {
      this._node.scrollTo = this.scrollTo;
      this._node.scrollBy = this.scrollBy;
      this._node.scroll = this.scrollTo;
      this._node.addEventListener('scroll', this._checkForArrival);
    }
  }
}
