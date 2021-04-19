import {ReactiveControllerHost} from 'lit-element';
import {Flip, FlipOptions} from './flip.js';

export const flipControllers: WeakMap<
  ReactiveControllerHost,
  FlipController
> = new WeakMap();

/**
 * FlipController can be used to provide default configuration options to all
 * `flip()` directives in a given component.
 *
 * It also provides control over all the `flip()` animations within a given
 * component, for example, `this.flipController.pause()` pauses all animations.
 */
export class FlipController {
  host: ReactiveControllerHost;
  flipOptions: FlipOptions;
  startPaused = false;
  disabled = false;
  onComplete?: () => void;

  constructor(
    host: ReactiveControllerHost,
    info: {
      flipOptions?: FlipOptions;
      startPaused?: boolean;
      disabled?: boolean;
      onComplete?: () => void;
    }
  ) {
    this.host = host;
    this.flipOptions = info.flipOptions || {};
    this.startPaused = !!info.startPaused;
    this.disabled = !!info.disabled;
    this.onComplete = info.onComplete;
    flipControllers.set(this.host, this);
  }

  /**
   * Set of active `flip()` in the host component
   */
  flips: Set<Flip> = new Set();

  protected pendingComplete = false;

  async add(flip: Flip) {
    this.flips.add(flip);
    if (this.startPaused) {
      flip.animation?.pause();
    }
    this.pendingComplete = true;
    await flip.finished;
    if (this.pendingComplete && !this.isAnimating) {
      this.pendingComplete = false;
      this.onComplete?.();
    }
  }

  remove(flip: Flip) {
    this.flips.delete(flip);
  }

  /**
   * Pauses all `flip()` animations running in the host component.
   */
  pause() {
    this.flips.forEach((f) => f.animation?.pause());
  }

  /**
   * Plays all active `flip()` animations in the host component.
   */
  play() {
    this.flips.forEach((f) => f.animation?.play());
  }

  cancel() {
    this.flips.forEach((f) => f.animation?.cancel());
    this.flips.clear();
  }

  finish() {
    this.flips.forEach((f) => f.animation?.finish());
    this.flips.clear();
  }

  /**
   * Toggles the play/pause state of all active `flip()` animations in the host component.
   */
  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  /**
   * Returns true if the host component has any active `flip()` animations.
   */
  get isAnimating() {
    return this.flips.size > 0;
  }

  /**
   * Returns true if the host component has any playing `flip()` animations.
   */
  get isPlaying() {
    return Array.from(this.flips).some(
      (a) => a.animation?.playState === 'running'
    );
  }

  async finished() {
    await Promise.all(Array.from(this.flips).map((f) => f.finished));
  }
}
