import {LitElement} from 'lit-element';
import {nothing, AttributePart} from 'lit-html';
import {directive, PartInfo, PartType} from 'lit-html/directive.js';
import {AsyncDirective} from 'lit-html/async-directive.js';

interface Positionables {
  readonly bottom: number;
  readonly height: number;
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly width: number;
}

type Ref = {value: HTMLElement};
export type TargetCallbackOrRef = () => HTMLElement | Ref;

export type Positions = Array<keyof Positionables>;

const positionedPoints = ['top', 'right', 'bottom', 'left'];

/**
 * Positions and sizes the element on which the `position()` directive is used
 * relative to the given target element.
 */
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

  update(part: AttributePart, [target, positions]: Parameters<this['render']>) {
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
      ((this._targetCallbackOrRef as unknown) as Ref).value ??
      this._targetCallbackOrRef?.();
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

export const position = directive(Position);
