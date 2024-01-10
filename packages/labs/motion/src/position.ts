/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import {LitElement} from 'lit';
import {nothing, AttributePart} from 'lit/html.js';
import {directive, PartInfo, PartType} from 'lit/directive.js';
import {AsyncDirective} from 'lit/async-directive.js';

interface Positionables {
  readonly bottom: number;
  readonly height: number;
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly width: number;
}

type Ref = {value: HTMLElement};
export type TargetCallbackOrRef = (() => HTMLElement) | Ref;

export type Positions = Array<keyof Positionables>;

const positionedPoints = ['top', 'right', 'bottom', 'left'];

export class Position extends AsyncDirective {
  private _host?: LitElement;
  private _element?: Element;
  private _targetCallbackOrRef!: TargetCallbackOrRef;
  private _positions?: Positions;

  constructor(part: PartInfo) {
    super(part);
    if (part.type !== PartType.ELEMENT) {
      throw new Error(
        'The `position` directive must be used in attribute position.'
      );
    }
  }

  render(_targetCallbackOrRef: TargetCallbackOrRef, _positions: Positions) {
    return nothing;
  }

  override update(
    part: AttributePart,
    [target, positions]: Parameters<this['render']>
  ) {
    if (this._host === undefined) {
      this._host = part.options?.host as LitElement;
      this._host.addController(this);
    }
    this._element = part.element;
    this._targetCallbackOrRef = target;
    this._positions = positions ?? ['left', 'top', 'width', 'height'];
    return this.render(target, positions);
  }

  hostUpdated() {
    this._position();
  }

  private _position() {
    const target =
      typeof this._targetCallbackOrRef === 'function'
        ? this._targetCallbackOrRef()
        : this._targetCallbackOrRef?.value;
    const parent = target.offsetParent;
    if (target === undefined || !parent) {
      return;
    }
    const tr = target.getBoundingClientRect();
    const pr = parent.getBoundingClientRect();
    this._positions?.forEach((p) => {
      const x = positionedPoints.includes(p) ? tr[p] - pr[p] : tr[p];
      (this._element as HTMLElement).style[p] = `${x}px`;
    });
  }
}

/**
 * Positions and sizes the element on which the `position()` directive is used
 * relative to the given target element.
 */
export const position = directive(Position);
