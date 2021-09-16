import {ReactiveControllerHost} from 'lit';
import {Animate, AnimateOptions} from './animate.js';

export const animateControllers: WeakMap<
  ReactiveControllerHost,
  AnimateController
> = new WeakMap();

/**
 * AnimateController can be used to provide default configuration options to all
 * `animate()` directives in a given component.
 *
 * It also provides control over all the `animate()` animations within a given
 * component, for example, `this.animateController.pause()` pauses all animations.
 */
export class AnimateController {
  host: ReactiveControllerHost;
  animateOptions: AnimateOptions;
  startPaused = false;
  disabled = false;
  onComplete?: () => void;

  constructor(
    host: ReactiveControllerHost,
    info: {
      animateOptions?: AnimateOptions;
      startPaused?: boolean;
      disabled?: boolean;
      onComplete?: () => void;
    }
  ) {
    this.host = host;
    this.animateOptions = info.animateOptions || {};
    this.startPaused = !!info.startPaused;
    this.disabled = !!info.disabled;
    this.onComplete = info.onComplete;
    animateControllers.set(this.host, this);
  }

  /**
   * Set of active `animate()` in the host component
   */
  animates: Set<Animate> = new Set();

  protected pendingComplete = false;

  async add(animate: Animate) {
    this.animates.add(animate);
    if (this.startPaused) {
      animate.animation?.pause();
    }
    this.pendingComplete = true;
    await animate.finished;
    if (this.pendingComplete && !this.isAnimating) {
      this.pendingComplete = false;
      this.onComplete?.();
    }
  }

  remove(animate: Animate) {
    this.animates.delete(animate);
  }

  /**
   * Pauses all `animate()` animations running in the host component.
   */
  pause() {
    this.animates.forEach((f) => f.animation?.pause());
  }

  /**
   * Plays all active `animate()` animations in the host component.
   */
  play() {
    this.animates.forEach((f) => f.animation?.play());
  }

  cancel() {
    this.animates.forEach((f) => f.animation?.cancel());
    this.animates.clear();
  }

  finish() {
    this.animates.forEach((f) => f.animation?.finish());
    this.animates.clear();
  }

  /**
   * Toggles the play/pause state of all active `animate()` animations in the host component.
   */
  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  /**
   * Returns true if the host component has any active `animate()` animations.
   */
  get isAnimating() {
    return this.animates.size > 0;
  }

  /**
   * Returns true if the host component has any playing `animate()` animations.
   */
  get isPlaying() {
    return Array.from(this.animates).some(
      (a) => a.animation?.playState === 'running'
    );
  }

  async finished() {
    await Promise.all(Array.from(this.animates).map((f) => f.finished));
  }
}
