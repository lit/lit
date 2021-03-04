import {ReactiveControllerHost} from 'lit-element';
import {FlipOptions} from './flip.js';

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
  options: FlipOptions;

  constructor(host: ReactiveControllerHost, options: FlipOptions) {
    this.host = host;
    this.options = options || {};
    flipControllers.set(this.host, this);
  }

  /**
   * Set of active `flip()` in the host component
   */
  animations: Set<Animation> = new Set();

  /**
   * Pauses all `flip()` animations running in the host component.
   */
  pause() {
    this.animations.forEach((a) => a.pause());
  }

  /**
   * Plays all active `flip()` animations in the host component.
   */
  play() {
    this.animations.forEach((a) => a.play());
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
    return this.animations.size > 0;
  }

  /**
   * Returns true if the host component has any playing `flip()` animations.
   */
  get isPlaying() {
    return Array.from(this.animations).some((a) => a.playState === 'running');
  }
}
