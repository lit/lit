/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import {ReactiveControllerHost} from 'lit';
import {Animate, Options} from './animate.js';

export const controllerMap = new WeakMap<
  ReactiveControllerHost,
  AnimateController
>();

/**
 * AnimateController can be used to provide default configuration options to all
 * `animate()` directives in a given component.
 *
 * It also provides control over all the `animate()` animations within a given
 * component, for example, `this.animateController.pause()` pauses all animations.
 */
export class AnimateController {
  host: ReactiveControllerHost;
  defaultOptions: Options;
  startPaused = false;
  disabled = false;
  onComplete?: () => void;

  constructor(
    host: ReactiveControllerHost,
    options: {
      defaultOptions?: Options;
      startPaused?: boolean;
      disabled?: boolean;
      onComplete?: () => void;
    }
  ) {
    this.host = host;
    this.defaultOptions = options.defaultOptions || {};
    this.startPaused = !!options.startPaused;
    this.disabled = !!options.disabled;
    this.onComplete = options.onComplete;
    controllerMap.set(this.host, this);
  }

  /**
   * Set of active `animate()` directives in the host component
   */
  clients = new Set<Animate>();

  protected pendingComplete = false;

  async add(animate: Animate) {
    this.clients.add(animate);
    if (this.startPaused) {
      animate.webAnimation?.pause();
    }
    this.pendingComplete = true;
    await animate.finished;
    if (this.pendingComplete && !this.isAnimating) {
      this.pendingComplete = false;
      this.onComplete?.();
    }
  }

  remove(animate: Animate) {
    this.clients.delete(animate);
  }

  /**
   * Pauses all animations running in the host component.
   */
  pause() {
    this.clients.forEach((f) => f.webAnimation?.pause());
  }

  /**
   * Plays all active animations in the host component.
   */
  play() {
    this.clients.forEach((f) => f.webAnimation?.play());
  }

  cancel() {
    this.clients.forEach((f) => f.webAnimation?.cancel());
    this.clients.clear();
  }

  finish() {
    this.clients.forEach((f) => f.webAnimation?.finish());
    this.clients.clear();
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
    return this.clients.size > 0;
  }

  /**
   * Returns true if the host component has any playing `animate()` animations.
   */
  get isPlaying() {
    return Array.from(this.clients).some(
      (a) => a.webAnimation?.playState === 'running'
    );
  }

  async finished() {
    await Promise.all(Array.from(this.clients).map((f) => f.finished));
  }
}
