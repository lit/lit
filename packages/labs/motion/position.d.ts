import {AttributePart} from 'lit-html';
import {PartInfo} from 'lit-html/directive.js';
import {DisconnectableDirective} from 'lit-html/disconnectable-directive.js';
interface Positionables {
  readonly bottom: number;
  readonly height: number;
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly width: number;
}
export declare type Positions = Array<keyof Positionables>;
export declare class Position extends DisconnectableDirective {
  private _host?;
  private _element?;
  private _targetCb?;
  private _positions?;
  constructor(part: PartInfo);
  render(_targetCb: () => HTMLElement, _positions: Positions): symbol;
  update(
    part: AttributePart,
    [targetCb, positions]: Parameters<this['render']>
  ): symbol;
  hostUpdated(): void;
  private _position;
}
export declare const position: (
  _targetCb: () => HTMLElement,
  _positions: Positions
) => import('lit-html/directive').DirectiveResult<typeof Position>;
export {};
//# sourceMappingURL=position.d.ts.map
