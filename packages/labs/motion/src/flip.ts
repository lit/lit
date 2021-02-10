import {LitElement} from 'lit-element';
import {nothing, AttributePart} from 'lit-html';
import {directive, PartInfo, PartType} from 'lit-html/directive.js';
import {AsyncDirective} from 'lit-html/async-directive.js';
import {ReactiveControllerHost} from 'lit-element';

// TODO(sorvell):
// 1. animate other properties than transform
// 2. hero animation
// 3. reverse scaling
// 4. spring?
// 5. cleanup
// 6. tests

// TODO(sorvell): Type better
export type CSSProperties = {
  [index: string]: string | number;
};

export type CSSPropertiesList = string[];

let z = 0;

const disconnectedProps: Map<unknown, CSSProperties> = new Map();
interface InverseData {
  options: FlipOptions;
  props: CSSProperties;
}

const inverseProps: Map<unknown, InverseData> = new Map();

const renderedHosts: WeakSet<ReactiveControllerHost> = new WeakSet();

export type FlipOptions = {
  id?: unknown;
  inverseId?: unknown;
  onComplete?: (element: HTMLElement, flip: Flip) => void;
  animationOptions?: KeyframeAnimationOptions;
  animationClass?: string;
  properties?: CSSPropertiesList;
  in?: Keyframe[];
  out?: Keyframe[];
  stabilizeOut?: boolean;
  skipInitial?: boolean;
  // TODO(sorvell): cannot use the guard directive because this need to guard against work being done in `hostUpdate` which happens before guard. A version of guard that was a controller and could subvert work done in `hostUpdate/Updated` on a nested directive ?!!? could address this and remove the need for a separate guard here.
  guard?: () => unknown;
};

const animationFrame = () =>
  new Promise((resolve) => requestAnimationFrame(resolve));

export const flyBelow = [{transform: 'translateY(100%) scale(0)', opacity: 0}];

export const flyAbove = [{transform: 'translateY(-100%) scale(0)', opacity: 0}];

export const fadeOut = [{opacity: 0}];
export const fade = fadeOut;

export const fadeIn = [{opacity: 0}, {opacity: 1}];

export const fadeInSlow = [
  {opacity: 0},
  {opacity: 0.25, offset: 0.75},
  {opacity: 1},
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
    const value = diffOp(a, b);
    return {value, transform: value && `translateX(${value}px)`};
  },
  top: (a: number, b: number) => {
    const value = diffOp(a, b);
    return {value, transform: value && `translateY(${value}px)`};
  },
  width: (a: number, b: number) => {
    const value = quotientOp(a, b);
    return {value, transform: value && `scaleX(${value})`};
  },
  height: (a: number, b: number) => {
    const value = quotientOp(a, b);
    return {value, transform: value && `scaleY(${value})`};
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

export class Flip extends AsyncDirective {
  private _host?: LitElement;
  private _from!: CSSProperties;
  private _to!: CSSProperties;
  private _animatingElement!: HTMLElement;
  private _parentNode: Element | null = null;
  private _nextSibling: Node | null = null;
  private _shouldAnimate = true;
  private _previousValue: unknown;

  rendered = false;
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
      this._host = part.options?.host as LitElement;
      this._host.addController(this);
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

  guard() {
    const value = this.options.guard?.();
    this._shouldAnimate =
      this._host!.hasUpdated &&
      !this._isAnimating() &&
      isDirty(value, this._previousValue);
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
  }

  hostUpdate() {
    this.guard();
    if (!this._shouldAnimate) {
      return;
    }
    const element = this._animatingElement;
    if (element.isConnected) {
      this._record(element, (this._from = {}));
    }
    this._parentNode = this._animatingElement.parentNode as Element;
    this._nextSibling = this._animatingElement.nextSibling;
  }

  async hostUpdated() {
    // wait for rendering so any sub-elements have a chance to render.
    await animationFrame;
    const hostRendered = renderedHosts.has(this._host!);
    this._host!.updateComplete.then(() => {
      renderedHosts.add(this._host!);
    });
    const inverse = this.options.inverseId
      ? inverseProps.get(this.options.inverseId)
      : undefined;
    const options = inverse ? inverse.options : this.options;
    if (
      !this._shouldAnimate ||
      !this._animatingElement.isConnected ||
      (options.skipInitial && !hostRendered)
    ) {
      return;
    }
    let frames: Keyframe[] | undefined;
    let animationOptions = options.animationOptions;
    if (inverse) {
      animationOptions = {...options.animationOptions, fill: 'both'};
      const w = inverse.props.width as number;
      const h = inverse.props.height as number;
      const x = w < 1 ? 1 / w : 1;
      const y = h < 1 ? 1 / h : 1;
      const f = {transform: `scaleX(${x}) scaleY(${y})`};
      frames = [f, f];
      console.log('inverse animation frames', x);
    } else {
      const element = this._animatingElement;
      this._record(element, (this._to = {}));
      const disconnected = disconnectedProps.get(this.options.id);
      const reconnectedFrames =
        disconnected && this._calculateFrames(disconnected, this._to);
      if (this._from) {
        frames = this._calculateFrames(this._from, this._to);
      } else if (reconnectedFrames) {
        frames = this.options.in
          ? [
              {...this.options.in[0], ...reconnectedFrames![0]},
              ...this.options.in.slice(1),
              reconnectedFrames![1],
            ]
          : reconnectedFrames;
      } else if (this.options.in) {
        frames = [...this.options.in, {}];
      }
      //console.log('animation frames', frames);
      if (disconnected && frames) {
        z++;
        frames.forEach((f) => (f.zIndex = z));
      }
    }
    if (frames !== undefined) {
      this._animate(frames, animationOptions);
    }
  }

  reconnected() {}

  // Experimental animate out functionality.
  async disconnected() {
    if (!this._shouldAnimate) {
      return;
    }
    if (this.options.id !== undefined) {
      disconnectedProps.set(this.options.id, this._from);
    }
    await animationFrame;
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
        const left = diffOp(this._from.left as number, shifted.left as number);
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
  }

  private _calculateFrames(from: CSSProperties, to: CSSProperties) {
    const fromFrame: Keyframe = {};
    const toFrame: Keyframe = {};
    let hasFrames = false;
    const props: CSSProperties = {};
    for (const p in to) {
      const f = from[p],
        t = to[p];
      if (p in transformProps) {
        const tp = transformProps[p as keyof typeof transformProps];
        if (f === undefined || t === undefined) {
          continue;
        }
        const op = tp(f as number, t as number);
        if (op.transform !== undefined) {
          if (this.options.id) {
            props[p] = op.value!;
          }
          hasFrames = true;
          fromFrame.transform = `${fromFrame.transform ?? ''} ${op.transform}`;
        }
      } else if (f !== t && f !== undefined && t !== undefined) {
        hasFrames = true;
        fromFrame[p] = f;
        toFrame[p] = t;
      }
    }
    fromFrame.transformOrigin = toFrame.transformOrigin = 'top left';
    if (this.options.id) {
      inverseProps.set(this.options.id, {options: this.options, props});
    }
    return hasFrames ? [fromFrame, toFrame] : undefined;
  }

  private _isAnimating() {
    return this.animation?.playState === 'running';
  }

  private async _animate(
    frames: Keyframe[],
    options = this.options.animationOptions
  ) {
    if (this._isAnimating()) {
      return;
    }
    this.animation = this._animatingElement.animate(frames, options);
    await this.animation.finished;
    disconnectedProps.delete(this.options.id);
    inverseProps.delete(this.options.id);
    this.options.onComplete?.(this._animatingElement, this);
  }
}

export const flip = directive(Flip);
