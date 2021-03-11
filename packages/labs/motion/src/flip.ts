import {LitElement} from 'lit-element';
import {nothing, AttributePart} from 'lit-html';
import {directive, PartInfo, PartType} from 'lit-html/directive.js';
import {AsyncDirective} from 'lit-html/async-directive.js';
import {ReactiveControllerHost} from 'lit-element';
import {flipControllers} from './flip-controller.js';
export {FlipController} from './flip-controller.js';

export type CSSValues = {
  [index: string]: string | number;
};

export type CSSPropertiesList = string[];

export const SCALE = {
  none: 0,
  up: 1,
  down: 2,
  both: 3,
} as const;

export type Scale = typeof SCALE[keyof typeof SCALE];

// zIndex for "in" animations
let z = 0;

const disconnectedProps: Map<unknown, CSSValues> = new Map();
const renderedHosts: WeakSet<ReactiveControllerHost> = new WeakSet();

export type FlipOptions = {
  // Id for this flip; used to link to other flips via e.g. `inId`
  id?: unknown;
  // Set to the flip id to map to when rendering "in"
  inId?: unknown;
  // If set, this flip will only scale inversely to its ancestor flips.
  // Values can be SCALE.up, SCALE.down, SCALE.both
  // Other flip properties are ignored.
  scaleInverse?: Scale;
  // Callback run when the flip animation is complete
  onComplete?: (element: HTMLElement, flip: Flip) => void;
  // Callback run to modify frames used to animate the flip
  onFrames?: (props: CSSValues, frames?: Keyframe[]) => Keyframe[];
  // Options used for the flip animation
  animationOptions?: KeyframeAnimationOptions;
  // List of css properties to animate
  properties?: CSSPropertiesList;
  // Keyframes to use when animating "in"
  in?: Keyframe[];
  // Keyframes to use when animating "out"
  out?: Keyframe[];
  // Set to true to match DOM position when animating "out"
  stabilizeOut?: boolean;
  // Skips animation when initially rendering
  skipInitial?: boolean;
  // True if the flip is disabled
  disabled?: boolean;
  // Callback run to produce a value which is dirty checked to determine if flip should run.
  guard?: () => unknown;
};

const animationFrame = () =>
  new Promise((resolve) => requestAnimationFrame(resolve));

// Presets for animating "in" and "out" of the DOM.
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

// Computes a transform given a before and after input for given properties.
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

// Dirty checks the value received from the `guard` option.
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

// Mapping of flip directives to the node on which they are used.
// Used to get the ancestor flip animations (which are used to modify
// flip transforms), done by ascending the DOM.
const flipMap: WeakMap<Node, Flip> = new WeakMap();

/**
 * `flip` animation directive class. Animates a node's position between renders.
 */
export class Flip extends AsyncDirective {
  private _host?: LitElement;
  private _fromValues!: CSSValues;
  private _element!: HTMLElement;
  private _parentNode: Element | null = null;
  private _nextSibling: Node | null = null;
  private _shouldFlip = true;
  private _previousValue: unknown;

  shouldLog = true;
  flipProps?: CSSValues;
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
      this._element = part.element;
      flipMap.set(this._element, this);
    }
    this._setOptions(options);
    return this.render(options);
  }

  private _setOptions(options?: FlipOptions) {
    if (options === undefined) {
      options = {};
    }
    // Mixin controller options.
    const flipController = flipControllers.get(this._host!);
    if (flipController !== undefined) {
      options = {
        ...flipController.options,
        ...options,
      };
    }
    // Ensure there are some properties to animation and some animation options.
    options!.properties ??= defaultCssProperties;
    if (options.scaleInverse !== undefined) {
      options.properties = ['width', 'height'];
    }
    this.options = options;
  }

  // Measures and returns metrics for the element's bounding box and styling
  private _measure() {
    const props: CSSValues = {};
    const bounds = this._element.getBoundingClientRect();
    const computedStyle = getComputedStyle(this._element);
    this.options.properties!.forEach((p) => {
      const v =
        bounds[p as keyof typeof bounds] ??
        computedStyle[p as keyof CSSStyleDeclaration];
      const asNum = Number(v);
      props[p] = isNaN(asNum) ? String(v) : asNum;
    });
    return props;
  }

  // Returns true if a flip should be started.
  private _canStartFlip() {
    const value = this.options.guard?.();
    this._shouldFlip =
      this._host!.hasUpdated &&
      !this.options.disabled &&
      !this.isAnimating() &&
      isDirty(value, this._previousValue) &&
      this._element.isConnected;
    if (this._shouldFlip) {
      // Copy the value if it's an array so that if it's mutated we don't forget
      // what the previous values were.
      this._previousValue = Array.isArray(value) ? Array.from(value) : value;
    }
    return this._shouldFlip;
  }

  hostUpdate() {
    if (this._canStartFlip()) {
      this._fromValues = this._measure();
      // Record parent and nextSibling used to re-attach node when flipping "out"
      this._parentNode =
        this._parentNode ?? (this._element.parentNode as Element);
      this._nextSibling = this._element.nextSibling;
    }
  }

  async hostUpdated() {
    // Wait for rendering so any sub-elements have a chance to render.
    await animationFrame;
    this.flip();
  }

  flip() {
    if (
      !this._shouldFlip ||
      !this._element.isConnected ||
      (this.options.skipInitial && !this.isHostRendered)
    ) {
      return;
    }
    let frames: Keyframe[] | undefined;
    const ancestors = this._getAncestors();
    // These inherit from ancestors. This allows easier synchronization of
    // child flips within ancestor flips.
    const animationOptions = this._calcAnimationOptions(
      ancestors,
      this.options.animationOptions
    );
    const toValues = this._measure();
    // Normal flip or inverse scale
    if (this._fromValues) {
      const {from, to} = this._applyAncestorAdjustments(
        this._fromValues,
        this._measure(),
        ancestors,
        this.options.scaleInverse!
      );
      const shouldScale = !!(this.options.scaleInverse! & SCALE.both);
      frames = this.calculateFrames(from, to, shouldScale, shouldScale);
      // "In" flip.
    } else {
      const disconnected = disconnectedProps.get(this.options.inId);
      if (disconnected) {
        // use disconnected data only once.
        disconnectedProps.delete(this.options.inId);
        const {from, to} = this._applyAncestorAdjustments(
          disconnected!,
          toValues,
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
    this.animate(frames, animationOptions);
  }

  private _getAncestors() {
    const ancestors = [];
    for (
      let p: Node | null | undefined = this._element.parentNode;
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
    // merges this flip's options over ancestor options over defaults
    const animationOptions = {...defaultAnimationOptions};
    ancestors.forEach((a) =>
      Object.assign(animationOptions, a.options.animationOptions)
    );
    Object.assign(animationOptions, options);
    return animationOptions;
  }

  reconnected() {}

  // Experimental animate out functionality.
  async disconnected() {
    if (!this._shouldFlip) {
      return;
    }
    if (this.options.id !== undefined) {
      disconnectedProps.set(this.options.id, this._fromValues);
    }
    await animationFrame;
    if (this._parentNode?.isConnected && this.options.out !== undefined) {
      const ref =
        this._nextSibling && this._nextSibling.parentNode === this._parentNode
          ? this._nextSibling
          : null;
      this._parentNode.insertBefore(this._element, ref);
      // Move to position before removal before animating
      const shifted = this._measure();
      if (this.options.stabilizeOut) {
        this.log('stabilizing out');
        const left = diffOp(
          this._fromValues.left as number,
          shifted.left as number
        );
        // TODO(sorvell): these nudges could conflict with existing styling
        // or animation but setting left/top should be rare, especially via
        // animation.
        if (left !== 0) {
          this._element.style.position = 'relative';
          this._element.style.left = left + 'px';
        }
        const top = diffOp(
          this._fromValues.top as number,
          shifted.top as number
        );
        if (top !== 0) {
          this._element.style.position = 'relative';
          this._element.style.top = top + 'px';
        }
      }
      await this.animate(this.options.out);
      this._element.remove();
    }
  }

  // Adjust position based on ancestor scaling.
  private _applyAncestorAdjustments(
    from: CSSValues,
    to: CSSValues,
    ancestors: Flip[],
    scaleInverse: Scale = SCALE.none
  ) {
    const ancestorProps = ancestors
      .map((a) => a.flipProps)
      .filter((a) => a !== undefined) as CSSValues[];
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
      if (scaleInverse) {
        // TODO(sorvell): scaling is WIP and needs refinement.
        const up = scaleInverse & SCALE.up;
        const down = scaleInverse & SCALE.down;
        const x = dScaleX < 1 ? (down ? 1 / dScaleX : 1) : up ? dScaleX : 1;
        const y = dScaleY < 1 ? (down ? 1 / dScaleY : 1) : up ? dScaleY : 1;
        //const orig = {...to};
        from.width = x * (to.width as number);
        from.height = y * (to.height as number);
        // console.log(
        //   'dScaleX',
        //   dScaleX,
        //   'mod',
        //   x,
        //   'orig',
        //   orig.width,
        //   'to final',
        //   from.width
        // );
      }
      if (from.left !== undefined) {
        from.left = dScaleX * (from.left as number);
        to.left = dScaleX * (to.left as number);
      }
      if (from.top !== undefined) {
        from.top = dScaleY * (from.top as number);
        to.top = dScaleY * (to.top as number);
      }
    }
    return {from, to};
  }

  protected calculateFrames(
    from: CSSValues,
    to: CSSValues,
    center = false,
    dupFrame = false
  ) {
    const fromFrame: Keyframe = {};
    const toFrame: Keyframe = {};
    let hasFrames = false;
    const props: CSSValues = {};
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
          props[p] = op.value!;
          hasFrames = true;
          fromFrame.transform = `${fromFrame.transform ?? ''} ${op.transform}`;
          if (dupFrame) {
            toFrame.transform = `${toFrame.transform ?? ''} ${op.transform}`;
          }
        }
      } else if (f !== t && f !== undefined && t !== undefined) {
        hasFrames = true;
        fromFrame[p] = f;
        toFrame[p] = t;
      }
    }
    fromFrame.transformOrigin = toFrame.transformOrigin = center
      ? 'center center'
      : 'top left';
    this.flipProps = props;
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
    this.animation = this._element.animate(frames, options);
    const controller = flipControllers.get(this._host!);
    controller?.add(this.animation);
    await this.animation.finished;
    this.flipProps = undefined;
    controller?.remove(this.animation);
    this.options.onComplete?.(this._element, this);
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
