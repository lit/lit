import {ReactiveElement} from 'reactive-element';
import {nothing, AttributePart} from 'lit-html';
import {directive, PartInfo, PartType} from 'lit-html/directive.js';
import {DisconnectableDirective} from 'lit-html/disconnectable-directive.js';

// TODO(sorvell): Type better
export type CSSProperties = {
  [index: string]: string | number;
};

export type CSSPropertiesList = string[];

export type FlipOptions = {
  onComplete?: () => void;
  animationOptions?: KeyframeAnimationOptions;
  properties?: CSSPropertiesList;
  in?: Keyframe[];
  out?: Keyframe[];
  fromElement?: Element;
  toElement?: Element;
};

export const flyBelow = [
  {transform: 'translateY(250%) scale(0.25)', opacity: 0},
];

const diffOp = (a: number, b: number) => {
  const v = a - b;
  return v === 0 ? undefined : v;
};
const quotientOp = (a: number, b: number) => {
  const v = a / b;
  return v === 1 ? undefined : v;
};

const transformProps = {
  left: (a: number, b: number) => {
    const v = diffOp(a, b);
    return v && `translateX(${v}px)`;
  },
  top: (a: number, b: number) => {
    const v = diffOp(a, b);
    return v && `translateY(${v}px)`;
  },
  width: (a: number, b: number) => {
    const v = quotientOp(a, b);
    return v && `scaleX(${v})`;
  },
  height: (a: number, b: number) => {
    const v = quotientOp(a, b);
    return v && `scaleY(${v})`;
  },
};

export class Flip extends DisconnectableDirective {
  host?: ReactiveElement;

  private _animation?: Animation;
  private _reversing = false;
  private _inFrames?: Keyframe[];
  private _outFrames?: Keyframe[];
  private _from!: CSSProperties;
  private _to!: CSSProperties;
  private _onComplete?: () => void;
  private _animatingElement!: HTMLElement;
  private _fromElement!: Element;
  private _toElement!: Element;
  private _parentNode: Element | null = null;
  private _nextSibling: Node | null = null;
  private _properties: CSSPropertiesList = [
    'left',
    'top',
    'width',
    'height',
    'opacity',
  ];
  private _animationOptions: KeyframeAnimationOptions = {
    duration: 333,
    easing: `ease-in-out`,
  };

  constructor(part: PartInfo) {
    super(part);
    if (part.type === PartType.CHILD) {
      throw new Error(
        'The `flip` directive must be used in attribute position.'
      );
    }
  }

  render(_options?: FlipOptions) {
    return nothing;
  }

  update(part: AttributePart, [options]: Parameters<this['render']>) {
    if (this.host === undefined) {
      this.host = part.options?.host as ReactiveElement;
      this.host.addController({
        willUpdate: () => this._beforeUpdate(),
        updated: () => this._afterUpdate(),
      });
    }
    this._onComplete = options?.onComplete;
    this._properties = options?.properties ?? this._properties;
    this._animationOptions =
      options?.animationOptions ?? this._animationOptions;
    this._animatingElement = part.element;
    this._fromElement = options?.fromElement ?? this._animatingElement;
    this._toElement = options?.toElement ?? this._animatingElement;
    this._inFrames = options?.in;
    this._outFrames = options?.out;
    return this.render(options);
  }

  private _record(element: Element, props: CSSProperties) {
    const bounds = element.getBoundingClientRect();
    const computedStyle = getComputedStyle(element);
    this._properties.forEach((p) => {
      const v =
        bounds[p as keyof typeof bounds] ??
        computedStyle[p as keyof CSSStyleDeclaration];
      const asNum = Number(v);
      props[p] = isNaN(asNum) ? String(v) : asNum;
    });
  }

  private _beforeUpdate() {
    if (this._isAnimating()) {
      // TODO(sorvell): what should this do?
      //this.animation.cancel();
      return;
    }
    const element = this._reversing ? this._toElement : this._fromElement;
    if (element.isConnected) {
      this._record(element, (this._from = {}));
    }
    this._parentNode = this._animatingElement.parentNode as Element;
    this._nextSibling = this._animatingElement.nextSibling;
  }

  private _afterUpdate() {
    if (this._isAnimating() || !this._animatingElement.isConnected) {
      return;
    }
    const element = this._reversing ? this._fromElement : this._toElement;
    this._reversing = !this._reversing;
    this._record(element, (this._to = {}));
    const frames =
      this._from !== undefined
        ? this._calculateFrames(this._from, this._to)
        : this._inFrames
        ? [...this._inFrames, {}]
        : undefined;
    if (frames !== undefined) {
      this._animate(frames);
    }
  }

  reconnectedCallback() {}

  // Experimental animate out functionality.
  disconnectedCallback() {
    requestAnimationFrame(async () => {
      if (this._parentNode?.isConnected && this._outFrames !== undefined) {
        this._parentNode.insertBefore(
          this._animatingElement,
          this._nextSibling
        );
        // Move to position before removal before animating
        const shifted: CSSProperties = {};
        this._record(this._animatingElement, shifted);
        const left = transformProps.left(
          this._from.left as number,
          shifted.left as number
        );
        const top = transformProps.top(
          this._from.top as number,
          shifted.top as number
        );
        const initialTransform = this._animatingElement.style.transform;
        const initialPosition = this._animatingElement.style.position;
        this._animatingElement.style.transform += ` ${left || ''} ${top || ''}`;
        this._animatingElement.style.position = 'absolute';
        await this._animate(this._outFrames);
        this._animatingElement.remove();
        this._animatingElement.style.position = initialPosition;
        this._animatingElement.style.transform = initialTransform;
      }
    });
  }

  private _calculateFrames(from: CSSProperties, to: CSSProperties) {
    const fromFrame: Keyframe = {};
    const toFrame: Keyframe = {};
    let hasFrames = false;

    for (const p in to) {
      const f = from[p],
        t = to[p];
      if (p in transformProps) {
        const tp = transformProps[p as keyof typeof transformProps];
        const v = tp(f as number, t as number);
        if (v !== undefined) {
          hasFrames = true;
          fromFrame.transform = `${fromFrame.transform ?? ''} ${v}`;
        }
      } else if (f !== t) {
        hasFrames = true;
        fromFrame[p] = f;
        toFrame[p] = t;
      }
    }
    return hasFrames ? [fromFrame, toFrame] : undefined;
  }

  private _isAnimating() {
    return this._animation?.playState === 'running';
  }

  private async _animate(frames: Keyframe[]) {
    if (this._isAnimating()) {
      return;
    }
    //console.log('animate', frames);
    this._animation = this._animatingElement.animate(
      frames,
      this._animationOptions
    );
    await this._animation.finished;
    if (this._onComplete) {
      this._onComplete();
    }
  }
}

export const flip = directive(Flip);
