import {LitElement, ReactiveControllerHost} from 'lit';
import {nothing, AttributePart} from 'lit/html.js';
import {directive, PartInfo, PartType} from 'lit/directive.js';
import {AsyncDirective} from 'lit/async-directive.js';
import {flipControllers} from './flip-controller.js';
export {FlipController} from './flip-controller.js';

export type CSSValues = {
  [index: string]: string | number;
};

export type CSSPropertiesList = string[];

// zIndex for "in" animations
let z = 0;

const disconnectedProps: Map<unknown, CSSValues> = new Map();
const renderedHosts: WeakSet<ReactiveControllerHost> = new WeakSet();

export type FlipOptions = {
  // Options used for the flip animation
  animationOptions?: KeyframeAnimationOptions;
  // List of css properties to animate
  properties?: CSSPropertiesList;
  // if `true`, the flip is disabled
  disabled?: boolean;
  // Callback run to produce a value which is dirty checked to determine if flip should run.
  guard?: () => unknown;
  // Id for this flip; used to link to other flips via e.g. `inId`
  id?: unknown;
  // Set to the flip id to map to when rendering "in"
  inId?: unknown;
  // Keyframes to use when animating "in"
  in?: Keyframe[];
  // Keyframes to use when animating "out"
  out?: Keyframe[];
  // Set to true to match DOM position when animating "out"
  stabilizeOut?: boolean;
  // Skips animation when initially rendering
  skipInitial?: boolean;
  // Callback run when the flip animation starts
  onStart?: (flip: Flip) => void;
  // Callback run when the flip animation is complete
  onComplete?: (flip: Flip) => void;
  // Callback run to modify frames used to animate the flip
  onFrames?: (flip: Flip) => Keyframe[] | undefined;
};

export const animationFrame = () =>
  new Promise((resolve) => requestAnimationFrame(resolve));

// Presets for animating "in" and "out" of the DOM.
export const flyBelow = [{transform: 'translateY(100%) scale(0)', opacity: 0}];
export const flyAbove = [{transform: 'translateY(-100%) scale(0)', opacity: 0}];
export const flyLeft = [{transform: 'translateX(-100%) scale(0)', opacity: 0}];
export const flyRight = [{transform: 'translateX(100%) scale(0)', opacity: 0}];
export const none = [{}];
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
  if (Array.isArray(value)) {
    // Dirty-check arrays by item
    if (
      Array.isArray(previous) &&
      previous.length === value.length &&
      value.every((v, i) => v === (previous as Array<unknown>)[i])
    ) {
      return false;
    }
  } else if (previous === value) {
    // Dirty-check non-arrays by identity
    return false;
  }
  return true;
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
  private _fromValues?: CSSValues;
  private _parentNode: Element | null = null;
  private _nextSibling: Node | null = null;
  private _shouldFlip = true;
  private _previousValue: unknown;
  private _flipStyles?: string | undefined | null;
  element!: HTMLElement;

  shouldLog = false;
  flipProps?: CSSValues;
  frames?: Keyframe[];
  animation?: Animation;
  options!: FlipOptions;
  optionsOrCallback?: (() => FlipOptions) | FlipOptions;

  finished!: Promise<void>;
  private _resolveFinished?: () => void;

  constructor(part: PartInfo) {
    super(part);
    if (part.type === PartType.CHILD) {
      throw new Error(
        'The `flip` directive must be used in attribute position.'
      );
    }
    this.createFinished();
  }

  createFinished() {
    this.resolveFinished?.();
    this.finished = new Promise((r) => {
      this._resolveFinished = r;
    });
  }

  async resolveFinished() {
    this._resolveFinished?.();
    this._resolveFinished = undefined;
  }

  render(_options?: (() => FlipOptions) | FlipOptions) {
    return nothing;
  }

  getController() {
    return flipControllers.get(this._host!);
  }

  isDisabled() {
    return this.options.disabled || this.getController()?.disabled;
  }

  update(part: AttributePart, [options]: Parameters<this['render']>) {
    const firstUpdate = this._host === undefined;
    if (firstUpdate) {
      this._host = part.options?.host as LitElement;
      this._host.addController(this);
      this.element = part.element;
      flipMap.set(this.element, this);
    }
    this.optionsOrCallback = options;
    if (firstUpdate || typeof options !== 'function') {
      this._setOptions(options as FlipOptions);
    }
    return this.render(options);
  }

  // TODO(sorvell): instead of a function/object, just use an object that the
  // user can mutate and create accessors for the data that do lookups as needed.
  // We're doing this every hostUpdate anyway and these lookups are fast.
  private _setOptions(options?: FlipOptions) {
    options = options ?? {};
    // Mixin controller options.
    const flipController = this.getController();
    if (flipController !== undefined) {
      options = {
        ...flipController.flipOptions,
        ...(options ?? {}),
      };
      options.animationOptions = {
        ...(flipController.flipOptions.animationOptions ?? {}),
        ...(options.animationOptions ?? {}),
      };
    }
    // Ensure there are some properties to animation and some animation options.
    options!.properties ??= defaultCssProperties;
    this.options = options;
  }

  // Measures and returns metrics for the element's bounding box and styling
  private _measure() {
    const props: CSSValues = {};
    const bounds = this.element.getBoundingClientRect();
    const computedStyle = getComputedStyle(this.element);
    this.options.properties!.forEach((p) => {
      const v =
        bounds[p as keyof typeof bounds] ??
        (!transformProps[p as keyof typeof transformProps]
          ? computedStyle[p as keyof CSSStyleDeclaration]
          : undefined);
      const asNum = Number(v);
      props[p] = isNaN(asNum) ? String(v) : asNum;
    });
    return props;
  }

  // Returns true if a flip should be started.
  private _canStartFlip() {
    let dirty = true,
      value = undefined;
    if (this.options.guard) {
      value = this.options.guard();
      dirty = isDirty(value, this._previousValue);
    }
    this._shouldFlip =
      this._host!.hasUpdated &&
      !this.isDisabled() &&
      !this.isAnimating() &&
      dirty &&
      this.element.isConnected;
    if (this._shouldFlip) {
      // Copy the value if it's an array so that if it's mutated we don't forget
      // what the previous values were.
      this._previousValue = Array.isArray(value) ? Array.from(value) : value;
    }
    return this._shouldFlip;
  }

  hostUpdate() {
    // TODO(sorvell): If options will change that will affect measuring,
    // then the user must pass a callback which can be called at update time.
    if (typeof this.optionsOrCallback === 'function') {
      this._setOptions(this.optionsOrCallback());
    }
    if (this._canStartFlip()) {
      this._fromValues = this._measure();
      // Record parent and nextSibling used to re-attach node when flipping "out"
      this._parentNode =
        this._parentNode ?? (this.element.parentNode as Element);
      this._nextSibling = this.element.nextSibling;
    }
  }

  hostUpdated() {
    this.flip();
  }

  reconnected() {}

  disconnected() {
    this.flipDisconnect();
  }

  resetStyles() {
    if (this._flipStyles !== undefined) {
      this.element.setAttribute('style', this._flipStyles ?? '');
      this._flipStyles = undefined;
    }
  }

  commitStyles() {
    this._flipStyles = this.element.getAttribute('style');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.animation as any)?.commitStyles();
    this.animation?.cancel();
  }

  async flip() {
    if (
      !this._shouldFlip ||
      !this.element.isConnected ||
      (this.options.skipInitial && !this.isHostRendered)
    ) {
      return;
    }
    this.beforeBeginFlip();
    // Wait for rendering so any sub-elements have a chance to render.
    await animationFrame;
    let frames: Keyframe[] | undefined;
    const ancestors = this._getAncestors();
    // These inherit from ancestors. This allows easier synchronization of
    // child flips within ancestor flips.
    const animationOptions = this._calcAnimationOptions(
      this.options.animationOptions,
      ancestors
    );
    const toValues = this._measure();
    // Normal flip or inverse scale
    if (this._fromValues !== undefined) {
      const {from, to} = this._applyAncestorAdjustments(
        this._fromValues,
        toValues,
        ancestors
      );
      this.log('measured', [this._fromValues, toValues, from, to]);
      frames = this.calculateFrames(from, to);
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
    this.beginFlip();
    const animated = await this.animate(frames, animationOptions);
    this.completeFlip(animated);
  }

  // Experimental animate out functionality.
  async flipDisconnect() {
    if (!this._shouldFlip) {
      return;
    }
    if (this.options.id !== undefined) {
      disconnectedProps.set(this.options.id, this._fromValues!);
    }
    if (this.options.out === undefined) {
      return;
    }
    this.beforeBeginFlip();
    await animationFrame();
    if (this._parentNode?.isConnected) {
      // put element back in DOM
      const ref =
        this._nextSibling && this._nextSibling.parentNode === this._parentNode
          ? this._nextSibling
          : null;
      this._parentNode.insertBefore(this.element, ref);
      // Optionally move element back to its position before it was detached.
      if (this.options.stabilizeOut) {
        // Measure current position after re-attaching.
        const shifted = this._measure();
        this.log('stabilizing out');
        // TODO(sorvell): these nudges could conflict with existing styling
        // or animation but setting left/top should be rare, especially via
        // animation.
        const left =
          (this._fromValues!.left as number) - (shifted.left as number);
        const top = (this._fromValues!.top as number) - (shifted.top as number);
        const isStatic = getComputedStyle(this.element).position === 'static';
        if (isStatic && (left !== 0 || top !== 0)) {
          this.element.style.position = 'relative';
        }
        if (left !== 0) {
          this.element.style.left = left + 'px';
        }
        if (top !== 0) {
          this.element.style.top = top + 'px';
        }
      }
    }
    // These inherit from ancestors. This allows easier synchronization of
    // child flips within ancestor flips.
    const animationOptions = this._calcAnimationOptions(
      this.options.animationOptions
    );
    this.beginFlip();
    const animated = await this.animate(this.options.out, animationOptions);
    this.completeFlip(animated);
    this.element.remove();
  }

  beforeBeginFlip() {
    this.createFinished();
  }

  beginFlip() {
    this.options.onStart?.(this);
  }

  completeFlip(didAnimate: boolean) {
    if (didAnimate) {
      this.options.onComplete?.(this);
    }
    this._fromValues = undefined;
    this.flipProps = undefined;
    this.frames = undefined;
    this.resolveFinished();
  }

  private _getAncestors() {
    const ancestors = [];
    for (
      let p: Node | null | undefined = this.element.parentNode;
      p;
      p = p?.parentNode
    ) {
      const a = flipMap.get(p!);
      if (a && !a.isDisabled() && a) {
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
    options: KeyframeAnimationOptions | undefined,
    ancestors: Flip[] = this._getAncestors()
  ) {
    // merges this flip's options over ancestor options over defaults
    const animationOptions = {...defaultAnimationOptions};
    ancestors.forEach((a) =>
      Object.assign(animationOptions, a.options.animationOptions)
    );
    Object.assign(animationOptions, options);
    return animationOptions;
  }

  // Adjust position based on ancestor scaling.
  private _applyAncestorAdjustments(
    from: CSSValues,
    to: CSSValues,
    ancestors: Flip[]
  ) {
    from = {...from};
    to = {...to};
    const ancestorProps = ancestors
      .map((a) => a.flipProps)
      .filter((a) => a !== undefined) as CSSValues[];
    let dScaleX = 1;
    let dScaleY = 1;
    if (ancestorProps !== undefined) {
      // gather scaling data for ancestors
      ancestorProps.forEach((a) => {
        if (a.width) {
          dScaleX = dScaleX / (a.width as number);
        }
        if (a.height) {
          dScaleY = dScaleY / (a.height as number);
        }
      });
      // Move position by ancestor scaling amount.
      if (from.left !== undefined && to.left !== undefined) {
        from.left = dScaleX * (from.left as number);
        to.left = dScaleX * (to.left as number);
      }
      if (from.top !== undefined && to.top !== undefined) {
        from.top = dScaleY * (from.top as number);
        to.top = dScaleY * (to.top as number);
      }
    }
    return {from, to};
  }

  protected calculateFrames(from: CSSValues, to: CSSValues, center = false) {
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
    return hasFrames ? [fromFrame, toFrame] : undefined;
  }

  protected async animate(
    frames: Keyframe[] | undefined,
    options = this.options.animationOptions
  ) {
    this.frames = frames;
    if (this.isAnimating() || this.isDisabled()) {
      return false;
    }
    if (this.options.onFrames) {
      this.frames = frames = this.options.onFrames(this);
      this.log('modified frames', frames);
    }
    if (frames === undefined) {
      return false;
    }
    this.log('animate', [frames, options]);
    this.animation = this.element.animate(frames, options);
    const controller = this.getController();
    controller?.add(this);
    try {
      await this.animation.finished;
    } catch (e) {
      // cancelled.
    }
    controller?.remove(this);
    return true;
  }

  protected isAnimating() {
    return this.animation?.playState === 'running' || this.animation?.pending;
  }

  log(message: string, data?: unknown) {
    if (this.shouldLog && !this.isDisabled()) {
      console.log(message, this.options.id, data);
    }
  }
}

export const flip = directive(Flip);
