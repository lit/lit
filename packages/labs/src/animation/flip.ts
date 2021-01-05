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

export const flyBelow = [{transform: 'translateY(100%) scale(0)', opacity: 0}];

export const flyAbove = [{transform: 'translateY(-100%) scale(0)', opacity: 0}];

export const fadeOut = [{opacity: 0}];
export const fade = fadeOut;

export const fadeIn = [{opacity: 0}, {opacity: 1}];

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

export const defaultAnimationOptions: KeyframeAnimationOptions = {
  duration: 333,
  easing: `ease-in-out`,
};

export const defaultCssProperties: CSSPropertiesList = [
  'left',
  'top',
  'width',
  'height',
  'opacity',
];

const isDirty = (value: unknown, previous: unknown) => {
  if (value === undefined && previous === undefined) {
    return true;
  }
  if (Array.isArray(value)) {
    // Dirty-check arrays by item
    if (
      Array.isArray(previous) &&
      previous.length === value.length &&
      value.every((v, i) => v !== (previous as Array<unknown>)[i])
    ) {
      return true;
    }
  } else if (previous !== value) {
    // Dirty-check non-arrays by identity
    return true;
  }
  return false;
};

export class Flip extends DisconnectableDirective {
  private _host?: ReactiveElement;
  private _from!: CSSProperties;
  private _to!: CSSProperties;
  private _animatingElement!: HTMLElement;
  private _parentNode: Element | null = null;
  private _nextSibling: Node | null = null;
  private _shouldAnimate = true;
  private _previousValue: unknown;

  reversing = false;
  animation?: Animation;
  options!: FlipOptions;

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
    if (this._host === undefined) {
      this._host = part.options?.host as ReactiveElement;
      this._host.addController({
        willUpdate: () => this._willUpdate(),
        updated: () => this._updated(),
      });
    }
    this.options = options || {};
    this.options.animationOptions ??= defaultAnimationOptions;
    this.options.properties ??= defaultCssProperties;
    this._animatingElement = part.element;
    return this.render(options);
  }

  private _record(element: Element, props: CSSProperties) {
    const bounds = element.getBoundingClientRect();
    const computedStyle = getComputedStyle(element);
    this.options.properties!.forEach((p) => {
      const v =
        bounds[p as keyof typeof bounds] ??
        computedStyle[p as keyof CSSStyleDeclaration];
      const asNum = Number(v);
      props[p] = isNaN(asNum) ? String(v) : asNum;
    });
    // console.log('measuring', element, props);
  }

  getMeasuredElement() {
    const el = this.reversing
      ? this.options.fromElement
      : this.options.toElement;
    return el ?? this._animatingElement;
  }

  private _willUpdate() {
    const value = this.options.guard?.();
    this._shouldAnimate =
      !this._isAnimating() && isDirty(value, this._previousValue);
    if (!this._shouldAnimate) {
      // TODO(sorvell): what should this do?
      //this.animation.cancel();
      return;
    }
    // Copy the value if it's an array so that if it's mutated we don't forget
    // what the previous values were.
    if (value !== undefined) {
      this._previousValue = Array.isArray(value) ? Array.from(value) : value;
    }
    //
    const element = this.getMeasuredElement();
    if (element.isConnected) {
      this._record(element, (this._from = {}));
    }
    this._parentNode = this._animatingElement.parentNode as Element;
    this._nextSibling = this._animatingElement.nextSibling;
  }

  private _updated() {
    if (!this._shouldAnimate || !this._animatingElement.isConnected) {
      return;
    }
    const element = this.getMeasuredElement();
    this._record(element, (this._to = {}));
    const frames =
      this._from !== undefined
        ? this._calculateFrames(this._from, this._to)
        : this.options.in
        ? [...this.options.in, {}]
        : undefined;
    console.log('animation frames', frames);
    if (frames !== undefined) {
      this._animate(frames);
    }
  }

  reconnectedCallback() {}

  // Experimental animate out functionality.
  disconnectedCallback() {
    if (!this._shouldAnimate) {
      return;
    }
    requestAnimationFrame(async () => {
      if (this._parentNode?.isConnected && this.options.out !== undefined) {
        const ref =
          this._nextSibling && this._nextSibling.parentNode === this._parentNode
            ? this._nextSibling
            : null;
        this._parentNode.insertBefore(this._animatingElement, ref);
        // Move to position before removal before animating
        const shifted: CSSProperties = {};
        this._record(this._animatingElement, shifted);
        if (this.options.stabilizeOut) {
          const left = diffOp(
            this._from.left as number,
            shifted.left as number
          );
          // TODO(sorvell): these nudges could conflict with existing styling
          // or animation but setting left/top should be rare, especially via
          // animation.
          if (left !== 0) {
            this._animatingElement.style.position = 'relative';
            this._animatingElement.style.left = left + 'px';
          }
          const top = diffOp(this._from.top as number, shifted.top as number);
          if (top !== 0) {
            this._animatingElement.style.position = 'relative';
            this._animatingElement.style.top = top + 'px';
          }
        }
        await this._animate(this.options.out);
        this._animatingElement.remove();
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
    return this.animation?.playState === 'running';
  }

  private async _animate(frames: Keyframe[]) {
    if (this._isAnimating()) {
      return;
    }
    //console.log('animate', frames);
    this.animation = this._animatingElement.animate(
      frames,
      this.options.animationOptions
    );
    await this.animation.finished;
    this.options.onComplete?.(this._animatingElement, this);
  }
}

export const flip = directive(Flip);
