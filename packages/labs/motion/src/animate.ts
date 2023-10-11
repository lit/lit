/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import {LitElement, ReactiveControllerHost} from 'lit';
import {nothing, AttributePart} from 'lit/html.js';
import {directive, PartInfo, PartType} from 'lit/directive.js';
import {AsyncDirective} from 'lit/async-directive.js';
import {controllerMap} from './animate-controller.js';
export {AnimateController} from './animate-controller.js';

export type CSSValues = {
  [index: string]: string | number;
};

export type CSSPropertiesList = string[];

// zIndex for "in" animations
let z = 0;

const disconnectedProps = new Map<unknown, CSSValues>();
const renderedHosts = new WeakSet<ReactiveControllerHost>();

export type Options = {
  // Options used for the animation
  keyframeOptions?: KeyframeAnimationOptions;
  // List of css properties to animate
  properties?: CSSPropertiesList;
  // if `true`, the `animate` is disabled
  disabled?: boolean;
  // Callback run to produce a value which is dirty checked to determine if animation should run.
  guard?: () => unknown;
  // Id for this `animate`; used to link to other `animate`s via e.g. `inId`
  id?: unknown;
  // Set to the `animate` id to map to when rendering "in"
  inId?: unknown;
  // Keyframes to use when animating "in"
  in?: Keyframe[];
  // Keyframes to use when animating "out"
  out?: Keyframe[];
  // Set to true to match DOM position when animating "out"
  stabilizeOut?: boolean;
  // Skips animation when initially rendering
  skipInitial?: boolean;
  // Callback run when the `animate` animation starts
  onStart?: (animate: Animate) => void;
  // Callback run when the animation is complete
  onComplete?: (animate: Animate) => void;
  // Callback run to modify frames used to animate
  onFrames?: (animate: Animate) => Keyframe[] | undefined;
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
export const transformProps: {
  [p: string]: (
    a: number,
    b: number
  ) => {
    value?: number;
    transform?: string;
    overrideFrom?: {[k: string]: string};
  };
} = {
  left: (a: number, b: number) => {
    const value = diffOp(a, b);
    const transform =
      value == null || isNaN(value) ? undefined : `translateX(${value}px)`;
    return {value, transform};
  },
  top: (a: number, b: number) => {
    const value = diffOp(a, b);
    const transform =
      value == null || isNaN(value) ? undefined : `translateY(${value}px)`;
    return {value, transform};
  },
  width: (a: number, b: number) => {
    let override: {} | undefined = undefined;
    // 'To' values of 0 would cause `value` to be Infinity. Instead we override
    // `b` to be 1 and add 1px as an override of width.
    if (b === 0) {
      b = 1;
      override = {width: '1px'};
    }
    const value = quotientOp(a, b);
    const transform =
      value == null || isNaN(value) ? undefined : `scaleX(${value})`;
    return {value, overrideFrom: override, transform};
  },
  height: (a: number, b: number) => {
    let override: {} | undefined = undefined;
    // 'To' values of 0 would cause `value` to be Infinity. Instead we override
    // `b` to be 1 and add 1px as an override of height.
    if (b === 0) {
      b = 1;
      override = {height: '1px'};
    }
    const value = quotientOp(a, b);
    const transform =
      value == null || isNaN(value) ? undefined : `scaleY(${value})`;
    return {value, overrideFrom: override, transform};
  },
};

export const defaultKeyframeOptions: KeyframeAnimationOptions = {
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

// Mapping of node on which the `animate` directive is used to the `animate` directive.
// Used to get the ancestor `animate` animations (which are used to modify
// `animate` transforms), done by ascending the DOM.
const nodeToAnimateMap = new WeakMap<Node, Animate>();

/**
 * `animate` directive class. Animates a node's position between renders.
 */
export class Animate extends AsyncDirective {
  private _host?: LitElement;
  private _fromValues?: CSSValues;
  private _parentNode: Element | null = null;
  private _nextSibling: Node | null = null;
  private _shouldAnimate = true;
  private _previousValue: unknown;
  private _styles?: string | undefined | null;
  element!: HTMLElement;

  shouldLog = false;
  animatingProperties?: CSSValues;
  frames?: Keyframe[];
  webAnimation?: Animation;
  options!: Options;
  optionsOrCallback?: (() => Options) | Options;

  finished!: Promise<void>;
  private _resolveFinished?: () => void;

  constructor(part: PartInfo) {
    super(part);
    if (part.type === PartType.CHILD) {
      throw new Error(
        'The `animate` directive must be used in attribute position.'
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

  render(_options?: (() => Options) | Options) {
    return nothing;
  }

  getController() {
    return controllerMap.get(this._host!);
  }

  isDisabled() {
    return this.options.disabled || this.getController()?.disabled;
  }

  override update(part: AttributePart, [options]: Parameters<this['render']>) {
    const firstUpdate = this._host === undefined;
    if (firstUpdate) {
      this._host = part.options?.host as LitElement;
      this._host.addController(this);
      this.element = part.element;
      nodeToAnimateMap.set(this.element, this);
    }
    this.optionsOrCallback = options;
    if (firstUpdate || typeof options !== 'function') {
      this._setOptions(options as Options);
    }
    return this.render(options);
  }

  // TODO(sorvell): instead of a function/object, just use an object that the
  // user can mutate and create accessors for the data that do lookups as needed.
  // We're doing this every hostUpdate anyway and these lookups are fast.
  private _setOptions(options?: Options) {
    options = options ?? {};
    // Mixin controller options.
    const controller = this.getController();
    if (controller !== undefined) {
      options = {
        ...controller.defaultOptions,
        ...options,
      };
      options.keyframeOptions = {
        ...controller.defaultOptions.keyframeOptions,
        ...options.keyframeOptions,
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

  // Returns true if a `animate` should be started.
  private _canStart() {
    let dirty = true,
      value = undefined;
    if (this.options.guard) {
      value = this.options.guard();
      dirty = isDirty(value, this._previousValue);
    }
    this._shouldAnimate =
      this._host!.hasUpdated &&
      !this.isDisabled() &&
      !this.isAnimating() &&
      dirty &&
      this.element.isConnected;
    if (this._shouldAnimate) {
      // Copy the value if it's an array so that if it's mutated we don't forget
      // what the previous values were.
      this._previousValue = Array.isArray(value) ? Array.from(value) : value;
    }
    return this._shouldAnimate;
  }

  hostUpdate() {
    // TODO(sorvell): If options will change that will affect measuring,
    // then the user must pass a callback which can be called at update time.
    if (typeof this.optionsOrCallback === 'function') {
      this._setOptions(this.optionsOrCallback());
    }
    if (this._canStart()) {
      this._fromValues = this._measure();
      // Record parent and nextSibling used to re-attach node when animating "out"
      this._parentNode =
        this._parentNode ?? (this.element.parentNode as Element);
      this._nextSibling = this.element.nextSibling;
    }
  }

  async hostUpdated() {
    if (
      !this._shouldAnimate ||
      !this.element.isConnected ||
      (this.options.skipInitial && !this.isHostRendered)
    ) {
      return;
    }
    this.prepare();
    // Wait for rendering so any sub-elements have a chance to render.
    await animationFrame;
    let frames: Keyframe[] | undefined;
    const ancestors = this._getAncestors();
    // These inherit from ancestors. This allows easier synchronization of
    // child `animate`s within ancestor `animate`s.
    const animationOptions = this._calculateKeyframeOptions(
      this.options.keyframeOptions,
      ancestors
    );
    const toValues = this._measure();
    // Normal or inverse scale
    if (this._fromValues !== undefined) {
      const {from, to} = this._applyAncestorAdjustments(
        this._fromValues,
        toValues,
        ancestors
      );
      this.log('measured', [this._fromValues, toValues, from, to]);
      frames = this.calculateKeyframes(from, to);
      // "In" `animate`.
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
        frames = this.calculateKeyframes(from, to);
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
        frames!.forEach((f) => (f['zIndex'] = z));
      } else if (this.options.in) {
        frames = [...this.options.in, {}];
      }
    }
    noAwait(this.animate(frames, animationOptions));
  }

  resetStyles() {
    if (this._styles !== undefined) {
      this.element.setAttribute('style', this._styles ?? '');
      this._styles = undefined;
    }
  }

  commitStyles() {
    this._styles = this.element.getAttribute('style');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.webAnimation as any)?.commitStyles();
    this.webAnimation?.cancel();
  }

  override reconnected() {}

  // Experimental animate out functionality.
  override async disconnected() {
    if (!this._shouldAnimate) {
      return;
    }
    if (this.options.id !== undefined) {
      disconnectedProps.set(this.options.id, this._fromValues!);
    }
    if (this.options.out === undefined) {
      return;
    }
    this.prepare();
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
          (this._fromValues!['left'] as number) - (shifted['left'] as number);
        const top =
          (this._fromValues!['top'] as number) - (shifted['top'] as number);
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
    // child `animate`s within ancestor `animate`s.
    const keyframeOptions = this._calculateKeyframeOptions(
      this.options.keyframeOptions
    );
    await this.animate(this.options.out, keyframeOptions);
    this.element.remove();
  }

  prepare() {
    this.createFinished();
  }

  start() {
    this.options.onStart?.(this);
  }

  didFinish(didAnimate: boolean) {
    if (didAnimate) {
      this.options.onComplete?.(this);
    }
    this._fromValues = undefined;
    this.animatingProperties = undefined;
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
      const a = nodeToAnimateMap.get(p!);
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

  private _calculateKeyframeOptions(
    options: KeyframeAnimationOptions | undefined,
    ancestors: Animate[] = this._getAncestors()
  ) {
    // merges this `animate`'s options over ancestor options over defaults
    const keyframeOptions = {...defaultKeyframeOptions};
    ancestors.forEach((a) =>
      Object.assign(keyframeOptions, a.options.keyframeOptions)
    );
    Object.assign(keyframeOptions, options);
    return keyframeOptions;
  }

  // Adjust position based on ancestor scaling.
  private _applyAncestorAdjustments(
    from: CSSValues,
    to: CSSValues,
    ancestors: Animate[]
  ) {
    from = {...from};
    to = {...to};
    const ancestorProps = ancestors
      .map((a) => a.animatingProperties)
      .filter((a) => a !== undefined) as CSSValues[];
    let dScaleX = 1;
    let dScaleY = 1;
    if (ancestorProps !== undefined) {
      // gather scaling data for ancestors
      ancestorProps.forEach((a) => {
        if (a['width']) {
          dScaleX = dScaleX / (a['width'] as number);
        }
        if (a['height']) {
          dScaleY = dScaleY / (a['height'] as number);
        }
      });
      // Move position by ancestor scaling amount.
      if (from['left'] !== undefined && to['left'] !== undefined) {
        from['left'] = dScaleX * (from['left'] as number);
        to['left'] = dScaleX * (to['left'] as number);
      }
      if (from['top'] !== undefined && to['top'] !== undefined) {
        from['top'] = dScaleY * (from['top'] as number);
        to['top'] = dScaleY * (to['top'] as number);
      }
    }
    return {from, to};
  }

  protected calculateKeyframes(from: CSSValues, to: CSSValues, center = false) {
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
          fromFrame['transform'] = `${fromFrame['transform'] ?? ''} ${
            op['transform']
          }`;
          if (op.overrideFrom !== undefined) {
            Object.assign(fromFrame, op.overrideFrom);
          }
        }
      } else if (f !== t && f !== undefined && t !== undefined) {
        hasFrames = true;
        fromFrame[p] = f;
        toFrame[p] = t;
      }
    }
    fromFrame['transformOrigin'] = toFrame['transformOrigin'] = center
      ? 'center center'
      : 'top left';
    this.animatingProperties = props;
    return hasFrames ? [fromFrame, toFrame] : undefined;
  }

  protected async animate(
    frames: Keyframe[] | undefined,
    options = this.options.keyframeOptions
  ) {
    this.start();
    this.frames = frames;
    let didAnimate = false;
    if (!this.isAnimating() && !this.isDisabled()) {
      if (this.options.onFrames) {
        this.frames = frames = this.options.onFrames(this);
        this.log('modified frames', frames);
      }
      if (frames !== undefined) {
        this.log('animate', [frames, options]);
        didAnimate = true;
        this.webAnimation = this.element.animate(frames, options);
        const controller = this.getController();
        noAwait(controller?.add(this));
        try {
          await this.webAnimation.finished;
        } catch (e) {
          // cancelled.
        }
        controller?.remove(this);
      }
    }
    this.didFinish(didAnimate);
    return didAnimate;
  }

  protected isAnimating() {
    return (
      this.webAnimation?.playState === 'running' || this.webAnimation?.pending
    );
  }

  log(message: string, data?: unknown) {
    if (this.shouldLog && !this.isDisabled()) {
      console.log(message, this.options.id, data);
    }
  }
}

/**
 * Used in an async function to mark a promise that we're deliberately not
 * awaiting.
 */
function noAwait(_p: null | undefined | Promise<unknown>) {}

/**
 * The `animate` directive animates a node's layout between renders.
 * It will perform a "tweening" animation between the two states based on
 * the options given. In addition, elements can animate when they initially
 * render to DOM and when they are removed.
 *
 * Options include:
 * * animationOptions:  configure animation via standard KeyframeAnimationOptions
 * * properties: list of properties to animate, defaults to
 * ['left', 'top','width', 'height', 'opacity', 'color', 'background']
 * * disabled: disables animation
 * * guard: function producing values that must change for the `animate` to run
 * * in: keyframes to use when animating in
 * * out: keyframes to use when animating out
 * * skipInitial: skip animating in the first time
 * * id: used to link to other `animate`s via `inId`
 * * inId: id of the `animate` to render from when animating in
 * * onStart: run when the `animate` starts
 * * onComplete: run when the `animate` completes
 * * onFrames: run when the frames are produces, use to modify frames
 */
export const animate = directive(Animate);
