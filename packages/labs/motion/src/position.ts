import {LitElement} from 'lit-element';
import {nothing, AttributePart} from 'lit-html';
import {directive, PartInfo, PartType} from 'lit-html/directive.js';
import {DisconnectableDirective} from 'lit-html/disconnectable-directive.js';

interface Positionables {
  readonly bottom: number;
  readonly height: number;
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly width: number;
}

export type Positions = Array<keyof Positionables>;

const positionedPoints = ['top', 'right', 'bottom', 'left'];

export class Position extends DisconnectableDirective {
  private _host?: LitElement;
  private _element?: Element;
  private _targetCb?: () => HTMLElement;
  private _positions?: Positions;

  constructor(part: PartInfo) {
    super(part);
    if (part.type === PartType.CHILD) {
      throw new Error(
        'The `flip` directive must be used in attribute position.'
      );
    }
  }

  render(_targetCb: () => HTMLElement, _positions: Positions) {
    return nothing;
  }

  update(
    part: AttributePart,
    [targetCb, positions]: Parameters<this['render']>
  ) {
    if (this._host === undefined) {
      this._host = part.options?.host as LitElement;
      this._host.addController(this);
    }
    this._element = part.element;
    this._targetCb = targetCb;
    this._positions = positions ?? ['left', 'top', 'width', 'height'];
    return this.render(targetCb, positions);
  }

  hostUpdated() {
    this._position();
  }

  private _position() {
    const target = this._targetCb?.();
    const parent = target?.offsetParent;
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
