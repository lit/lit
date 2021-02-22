import {ReactiveControllerHost} from 'lit-element';
import {FlipOptions} from './flip.js';

export const flipControllers: WeakMap<
  ReactiveControllerHost,
  FlipController
> = new WeakMap();
export class FlipController {
  host: ReactiveControllerHost;
  options: FlipOptions;

  constructor(host: ReactiveControllerHost, options: FlipOptions) {
    this.host = host;
    this.options = options || {};
    flipControllers.set(this.host, this);
  }

  animations: Set<Animation> = new Set();

  pause() {
    this.animations.forEach((a) => a.pause());
  }

  play() {
    this.animations.forEach((a) => a.play());
  }

  toggle() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  get isAnimating() {
    return this.animations.size > 0;
  }

  get isPlaying() {
    return Array.from(this.animations).some((a) => a.playState === 'running');
  }
}
