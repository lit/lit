import {AttributePart} from 'lit-html';
import {PartInfo} from 'lit-html/directive.js';
import {DisconnectableDirective} from 'lit-html/disconnectable-directive.js';
export declare type CSSProperties = {
  [index: string]: string | number;
};
export declare type CSSPropertiesList = string[];
export declare type FlipOptions = {
  onComplete?: (element: HTMLElement, flip: Flip) => void;
  animationOptions?: KeyframeAnimationOptions;
  properties?: CSSPropertiesList;
  in?: Keyframe[];
  out?: Keyframe[];
  fromElement?: Element;
  toElement?: Element;
  stabilizeOut?: boolean;
  guard?: () => unknown;
};
export declare const flyBelow: {
  transform: string;
  opacity: number;
}[];
export declare const flyAbove: {
  transform: string;
  opacity: number;
}[];
export declare const fadeOut: {
  opacity: number;
}[];
export declare const fade: {
  opacity: number;
}[];
export declare const fadeIn: {
  opacity: number;
}[];
export declare const defaultAnimationOptions: KeyframeAnimationOptions;
export declare const defaultCssProperties: CSSPropertiesList;
export declare class Flip extends DisconnectableDirective {
  private _host?;
  private _from;
  private _to;
  private _animatingElement;
  private _parentNode;
  private _nextSibling;
  private _shouldAnimate;
  private _previousValue;
  reversing: boolean;
  animation?: Animation;
  options: FlipOptions;
  constructor(part: PartInfo);
  render(_options?: FlipOptions): symbol;
  update(part: AttributePart, [options]: Parameters<this['render']>): symbol;
  private _record;
  getMeasuredElement(): Element;
  hostUpdate(): void;
  hostUpdated(): void;
  reconnectedCallback(): void;
  disconnectedCallback(): void;
  private _calculateFrames;
  private _isAnimating;
  private _animate;
}
export declare const flip: (
  _options?: FlipOptions | undefined
) => import('lit-html/directive').DirectiveResult<typeof Flip>;
//# sourceMappingURL=flip.d.ts.map
