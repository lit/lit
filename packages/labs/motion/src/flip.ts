import {LitElement} from 'lit-element';
import {nothing, AttributePart} from 'lit-html';
import {directive, PartInfo, PartType} from 'lit-html/directive.js';
import {AsyncDirective} from 'lit-html/async-directive.js';
import {ReactiveControllerHost} from 'lit-element';
import {flipControllers} from './flip-controller.js';
export {FlipController} from './flip-controller.js';

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
  inId?: unknown;
  inverseId?: unknown;
  onComplete?: (element: HTMLElement, flip: Flip) => void;
  onFrames?: (props: CSSProperties, frames?: Keyframe[]) => Keyframe[];
  animationOptions?: KeyframeAnimationOptions;
  animationClass?: string;
  properties?: CSSPropertiesList;
  in?: Keyframe[];
  out?: Keyframe[];
  stabilizeOut?: boolean;
  skipInitial?: boolean;
  disabled?: boolean;
  disableController?: boolean;
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

export const transformProps = {
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
  'color',
  'background',
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

const flipMap: WeakMap<Node, Flip> = new WeakMap();

export class Flip extends AsyncDirective {
  private _host?: LitElement;
  private _from!: CSSProperties;
  private _to!: CSSProperties;
  private _animatingElement!: HTMLElement;
  private _parentNode: Element | null = null;
  private _nextSibling: Node | null = null;
  private _shouldFlip = true;
  private _previousValue: unknown;

  shouldLog = false;
  flipProps?: CSSProperties;
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
      this._animatingElement = part.element;
      flipMap.set(this._animatingElement, this);
    }
    this._setOptions(options);
    return this.render(options);
  }

  private _setOptions(options?: FlipOptions) {
    if (options === undefined) {
      options = {};
    }
    if (!options.disableController) {
      const controller = flipControllers.get(this._host!);
      if (controller !== undefined) {
        options = {
          ...controller.options,
          ...options,
        };
      }
    }
    options!.animationOptions ??= defaultAnimationOptions;
    options!.properties ??= defaultCssProperties;
    this.options = options;
  }

  private _measure() {
    const props: CSSProperties = {};
    const bounds = this._animatingElement.getBoundingClientRect();
    const computedStyle = getComputedStyle(this._animatingElement);
    this.options.properties!.forEach((p) => {
      const v =
        bounds[p as keyof typeof bounds] ??
        computedStyle[p as keyof CSSStyleDeclaration];
      const asNum = Number(v);
      props[p] = isNaN(asNum) ? String(v) : asNum;
    });
    return props;
  }

  private _canStartFlip() {
    const value = this.options.guard?.();
    this._shouldFlip =
      this._host!.hasUpdated &&
      !this.options.disabled &&
      !this.isAnimating() &&
      isDirty(value, this._previousValue);
    if (this._shouldFlip) {
      // Copy the value if it's an array so that if it's mutated we don't forget
      // what the previous values were.
      this._previousValue = Array.isArray(value) ? Array.from(value) : value;
    }
    return this._shouldFlip;
  }

  hostUpdate() {
    if (this._canStartFlip()) {
      if (this._animatingElement.isConnected) {
        this._from = this._measure();
      }
      this._parentNode =
        this._parentNode ?? (this._animatingElement.parentNode as Element);
      this._nextSibling = this._animatingElement.nextSibling;
    }
  }

  async hostUpdated() {
    // Wait for rendering so any sub-elements have a chance to render.
    await animationFrame;
    this.flip();
  }

  flip() {
    // TODO(sorvell): decide if inverse is supported.
    const inverse = this.options.inverseId
      ? inverseProps.get(this.options.inverseId)
      : undefined;
    const options = inverse ? inverse.options : this.options;
    if (
      !this._shouldFlip ||
      !this._animatingElement.isConnected ||
      (options.skipInitial && !this.isHostRendered)
    ) {
      return;
    }
    let frames: Keyframe[] | undefined;
    const ancestors = this._getAncestors();
    let animationOptions = this._calcAnimationOptions(
      ancestors,
      options.animationOptions
    );
    // inverse flip
    if (inverse && !options.disabled) {
      animationOptions = {...options.animationOptions, fill: 'both'};
      const w = inverse.props.width as number;
      const h = inverse.props.height as number;
      const x = w < 1 ? 1 / w : 1;
      const y = h < 1 ? 1 / h : 1;
      const f = {
        transform: `scaleX(${x}) scaleY(${y})`,
      };
      frames = [f, f];
      // normal flip
    } else {
      this._to = this._measure();
      if (this._from) {
        frames = this.calculateFrames(this._from, this._to);
      } else {
        const disconnected = disconnectedProps.get(this.options.inId);
        if (disconnected) {
          // use disconnected data only once.
          disconnectedProps.delete(this.options.inId);
          const {from, to} = this._applyAncestorAdjustments(
            disconnected!,
            this._to,
            ancestors
          );
          frames = this.calculateFrames(from, to);
          // "merge" with "in" frames
          frames = this.options.in
            ? [
                {...this.options.in[0], ...frames![0]},
                ...this.options.in.slice(1),
                frames![1],
              ]
            : frames;
          // adjust z so always on top...
          z++;
          frames!.forEach((f) => (f.zIndex = z));
        } else if (this.options.in) {
          frames = [...this.options.in, {}];
        }
      }
    }
    this.animate(frames, animationOptions);
  }

  private _getAncestors() {
    const ancestors = [];
    for (
      let p: Node | null | undefined = this._animatingElement.parentNode;
      p;
      p = p?.parentNode
    ) {
      const a = flipMap.get(p!);
      if (a && !a.options.disabled && a) {
        ancestors.push(a);
      }
    }
    return ancestors;
  }

  private _applyAncestorAdjustments(
    from: CSSProperties,
    to: CSSProperties,
    ancestors: Flip[]
  ) {
    const ancestorProps = ancestors
      .map((a) => a.flipProps)
      .filter((a) => a !== undefined) as CSSProperties[];
    let dScaleX = 1;
    let dScaleY = 1;
    if (ancestorProps !== undefined) {
      ancestorProps.forEach((a) => {
        if (a.width) {
          dScaleX = dScaleX / (a.width as number);
        }
        if (a.height) {
          dScaleY = dScaleY / (a.height as number);
        }
      });
      from.left = dScaleX * (from.left as number);
      from.top = dScaleY * (from.top as number);
      to.left = dScaleX * (to.left as number);
      to.top = dScaleY * (to.top as number);
    }
    return {from, to};
  }

  protected get isHostRendered() {
    const hostRendered = renderedHosts.has(this._host!);
    if (!hostRendered) {
      this._host!.updateComplete.then(() => {
        renderedHosts.add(this._host!);
      });
    }
    return hostRendered;
  }

  private _calcAnimationOptions(
    ancestors: Flip[],
    options?: KeyframeAnimationOptions
  ) {
    if (options === defaultAnimationOptions) {
      const a = ancestors.find(
        (a) => a.options.animationOptions !== defaultAnimationOptions
      );
      options = a?.options.animationOptions ?? options;
    }
    return options;
  }

  reconnected() {}

  // Experimental animate out functionality.
  async disconnected() {
    if (!this._shouldFlip) {
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
      const shifted = this._measure();
      if (this.options.stabilizeOut) {
        this.log('stabilizing out');
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
      await this.animate(this.options.out);
      this._animatingElement.remove();
    }
  }

  protected calculateFrames(from: CSSProperties, to: CSSProperties) {
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
    this.flipProps = props;
    if (this.options.id) {
      inverseProps.set(this.options.id, {options: this.options, props});
    }
    let frames = hasFrames ? [fromFrame, toFrame] : undefined;
    if (this.options.onFrames) {
      frames = this.options.onFrames(this.flipProps, frames);
      this.log('modified frames', frames);
    }
    return frames;
  }

  protected async animate(
    frames: Keyframe[] | undefined,
    options = this.options.animationOptions
  ) {
    if (this.isAnimating() || this.options.disabled || frames === undefined) {
      return;
    }
    this.log('animate', [frames, options]);
    this.animation = this._animatingElement.animate(frames, options);
    const controller = flipControllers.get(this._host!);
    controller?.animations.add(this.animation);
    await this.animation.finished;
    this.flipProps = undefined;
    controller?.animations.delete(this.animation);
    this.options.onComplete?.(this._animatingElement, this);
  }

  protected isAnimating() {
    return this.animation?.playState === 'running';
  }

  log(message: string, data?: unknown) {
    if (!this.options?.disabled && this.shouldLog) {
      console.log(message, this.options.id, data);
    }
  }
}

export const flip = directive(Flip);
