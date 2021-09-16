import {LitElement, ReactiveElement, ReactiveControllerHost} from 'lit';
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
  disableTransform?: boolean;
  // Callback run before the flip animation prepares to start, before measuring.
  onPrepare?: (flip: Flip) => void;
  // Callback run when the flip animation is complete
  onComplete?: (flip: Flip) => void;
  // Callback run before the flip animation starts
  onStart?: (flip: Flip) => Keyframe[] | void;
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
  const v = b === 0 ? 0 : a / b;
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
    return {
      value,
      transform: value !== undefined ? `scaleX(${value})` : undefined,
    };
  },
  height: (a: number, b: number) => {
    const value = quotientOp(a, b);
    return {
      value,
      transform: value !== undefined ? `scaleY(${value})` : undefined,
    };
  },
};

const pxProps = new Set(['left', 'top', 'right', 'bottom', 'weight', 'height']);

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

// Mapping of node on which the flip directive is used to the flip directive.
// Used to get the ancestor flip animations (which are used to modify
// flip transforms), done by ascending the DOM.
const flipMap: WeakMap<Node, Flip> = new WeakMap();

const IN = 'in';
const OUT = 'out';
const TRANSITION = 'transition';
export type FlipType = typeof IN | typeof OUT | typeof TRANSITION | '';

/**
 * `flip` animation directive class. Animates a node's position between renders.
 */
export class Flip extends AsyncDirective {
  private _host?: LitElement;
  private _fromValues?: CSSValues;
  private _parentNode: Element | null = null;
  private _nextSibling: Node | null = null;
  private _canFlip = true;
  private _previousValue: unknown;
  private _ancestors?: Flip[];
  private _flipStyles?: string | undefined | null;
  private _enableLogging = false;
  private _isDisconnecting = false;
  type: FlipType = '';
  element!: HTMLElement;
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
    const controller = this.getController();
    controller?.add(this);
  }

  async resolveFinished() {
    this._resolveFinished?.();
    this._resolveFinished = undefined;
    const controller = this.getController();
    controller?.remove(this);
  }

  render(_options?: (() => FlipOptions) | FlipOptions) {
    return nothing;
  }

  getController() {
    return flipControllers.get(this._host!);
  }

  protected isFlipping() {
    return !!this._resolveFinished;
  }

  protected isAnimating() {
    return this.animation?.playState === 'running' || this.animation?.pending;
  }

  protected isDisabled() {
    return this.options.disabled || this.getController()?.disabled;
  }

  override update(part: AttributePart, [options]: Parameters<this['render']>) {
    const firstUpdate = this._host === undefined;
    if (firstUpdate) {
      this._host = part.options?.host as LitElement;
      this._host.addController(this);
      this.element = part.element;
      flipMap.set(this.element, this);
    }
    this.optionsOrCallback = options;
    if (firstUpdate || typeof options !== 'function') {
      this.setOptions(options as FlipOptions);
    }
    return this.render(options);
  }

  // TODO(sorvell): instead of a function/object, just use an object that the
  // user can mutate and create accessors for the data that do lookups as needed.
  // We're doing this every hostUpdate anyway and these lookups are fast.
  protected setOptions(options?: FlipOptions) {
    options = options ?? {};
    // Mixin controller options.
    const flipController = this.getController();
    if (flipController !== undefined) {
      options = {
        ...flipController.flipOptions,
        ...options,
      };
      options.animationOptions = {
        ...flipController.flipOptions.animationOptions,
        ...options.animationOptions,
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
  protected canFlip() {
    let dirty = true,
      value = undefined;
    if (this.options.guard) {
      value = this.options.guard();
      dirty = isDirty(value, this._previousValue);
    }
    this._canFlip = !this.isDisabled() && dirty && this.element.isConnected;
    if (this._canFlip) {
      // Copy the value if it's an array so that if it's mutated we don't forget
      // what the previous values were.
      this._previousValue = Array.isArray(value) ? Array.from(value) : value;
    }
    return this._canFlip;
  }

  hostUpdate() {
    // TODO(sorvell): If options will change that will affect measuring,
    // then the user must pass a callback which can be called at update time.
    // TODO(sorvell): REMOVE THIS?!?
    if (typeof this.optionsOrCallback === 'function') {
      this.setOptions(this.optionsOrCallback());
    }
    if (this.canFlip()) {
      this._fromValues = this._measure();
    }
  }

  hostUpdated() {
    if (!this._isDisconnecting) {
      this.flip();
    }
  }

  override reconnected() {}

  override disconnected() {
    if (this.options.id !== undefined) {
      const m = this._fromValues ?? this._measure();
      disconnectedProps.set(this.options.id, m);
      this.log('disconnected', m);
    }
    // Note, this state is reset when flip is complete
    this._isDisconnecting = true;
    this.flip();
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

  /**
   * Flip steps:
   * should start?
   * * prepare:
   *   * create finished
   *   * await animationFrame
   *   * call onPrepare
   * * create frames
   *   * disconnect
   *     * put node back
   *     * maybe measure and move
   *     * return "out" frames
   *   * transition (normal)
   *     * measure
   *     * adjust
   *     * calculate frames
   *   * in
   *     * if disconnected
   *       * measure
   *       * calculate frames
   *       * mixin "in"
   *     * else return "in"
   * * startFlip
   *   * call onStart
   * * animate
   * * completeFlip
   *   * call onComplete
   *   * reset state
   *   * call onComplete
   * @param isDisconnecting
   * @returns
   */
  async flip() {
    const updateOk = !this.options.skipInitial || this.isHostRendered;
    const elementOk =
      (!this._isDisconnecting && this.element.isConnected) ||
      (this._isDisconnecting && this.options.out !== undefined);
    if (!this._canFlip || !updateOk || !elementOk) {
      // Always cleanup since we might need to finish the first flip
      this.cleanup();
      return;
    }
    await this.prepare();
    if (!this.isAnimating() && !this.isDisabled()) {
      this.type = this._isDisconnecting
        ? OUT
        : this._fromValues !== undefined
        ? TRANSITION
        : IN;
      switch (this.type) {
        case OUT:
          this.frames = this.setupOut();
          break;
        case IN:
          this.frames = this.setupIn();
          break;
        default:
          this.frames = this.setupTransition();
          break;
      }
      this.log(`flip: ${this.type}`, this.frames);
      this.start();
      await this.animate();
      if (this._isDisconnecting) {
        this.element.remove();
      }
      this.complete();
    }
    this.cleanup();
  }

  setupTransition() {
    const {from, to} = this._applyAncestorAdjustments(
      this._fromValues!,
      this._measure()
    );
    return this.calculateFrames(from, to);
  }

  setupIn() {
    let frames;
    const disconnected = disconnectedProps.get(this.options.inId);
    if (disconnected) {
      this.log(
        `retrieved disconnected values from ${this.options.inId}`,
        disconnected
      );
      // use disconnected data only once.
      disconnectedProps.delete(this.options.inId);
      const {from, to} = this._applyAncestorAdjustments(
        disconnected!,
        this._measure()
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
    return frames;
  }

  setupOut() {
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
    return this.options.out;
  }

  async prepare() {
    this.createFinished();
    // Record parent and nextSibling used to re-attach node when flipping "out"
    this._parentNode = this.element.parentNode as Element;
    this._nextSibling = this.element.nextSibling;
    this.type = '';
    this.options.onPrepare?.(this);
    // Wait for rendering so any sub-elements have a chance to render.
    await animationFrame();
    this._ancestors = this._getAncestors();
  }

  start() {
    this.options.onStart?.(this);
  }

  complete() {
    this.options.onComplete?.(this);
  }

  cleanup() {
    this._fromValues = undefined;
    this.flipProps = undefined;
    this.frames = undefined;
    this._ancestors = undefined;
    this._isDisconnecting = false;
    this._parentNode = null;
    this._nextSibling = null;
    this.type = '';
    this.animation?.cancel();
    this.animation = undefined;
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

  private _calcAnimationOptions(options: KeyframeAnimationOptions | undefined) {
    // merges this flip's options over ancestor options over defaults
    const animationOptions = {...defaultAnimationOptions};
    this._ancestors!.forEach((a) =>
      Object.assign(animationOptions, a.options.animationOptions)
    );
    Object.assign(animationOptions, options);
    return animationOptions;
  }

  // Adjust position based on ancestor scaling.
  private _applyAncestorAdjustments(from: CSSValues, to: CSSValues) {
    from = {...from};
    to = {...to};
    const ancestorProps = this._ancestors!.map((a) => a.flipProps).filter(
      (a) => a !== undefined
    ) as CSSValues[];
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
    const useTransform = !this.options.disableTransform;
    for (const p in to) {
      const f = from[p],
        t = to[p];
      if (useTransform && p in transformProps) {
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
        const isPxProp = pxProps.has(p);
        props[p] = t;
        fromFrame[p] = isPxProp ? `${f}px` : f;
        toFrame[p] = isPxProp ? `${t}px` : t;
      }
    }
    fromFrame.transformOrigin = toFrame.transformOrigin = center
      ? 'center center'
      : 'top left';
    this.flipProps = props;
    this.log('calculateFrames', [from, fromFrame, to, toFrame]);
    return hasFrames ? [fromFrame, toFrame] : undefined;
  }

  protected async animate() {
    if (this.frames === undefined) {
      return;
    }
    // These inherit from ancestors. This allows easier synchronization of
    // child flips within ancestor flips.
    const options = this._calcAnimationOptions(this.options.animationOptions);
    this.animation = this.element.animate(this.frames!, options);
    try {
      await this.animation.finished;
    } catch (e) {
      // cancelled.
    }
  }

  log(message: string, data?: unknown) {
    if (this._enableLogging && !this.isDisabled()) {
      console.log(message, this.options.id ?? '', data ?? '');
    }
  }
}

/**
 * The `flip` animation directive animates a node's layout between renders.
 * It will perform a "tweening" animation between the two states based on
 * the options given. In addition, elements can animate when they initially
 * render to DOM and when they are removed.
 *
 * Options include:
 * * animationOptions:  configure animation via standard KeyframeAnimationOptions
 * * properties: list of properties to animate, defaults to
 * ['left', 'top','width', 'height', 'opacity', 'color', 'background']
 * * disabled: disables animation
 * * guard: function producing values that must change for the flip to run
 * * in: keyframes to use when animating in
 * * out: keyframes to use when animating out
 * * skipInitial: skip animating in the first time
 * * id: used to link to other flips via `inId`
 * * inId: id of the flip to render from when animating in
 * * onStart: run before the flip starts
 * * onComplete: run when the flip completes
 * * onFrames: run when the frames are produces, use to modify frames
 */
export const flip = directive(Flip);
