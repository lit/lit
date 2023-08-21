/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import type {ReactiveController, ReactiveControllerHost} from 'lit';
import {Spring, SpringConfig as WobbleSpringConfig} from 'wobble';

export type SpringConfig = Partial<WobbleSpringConfig>;

/**
 * A reactive controller that implements a 1D spring physics simulation based
 * on the equations behind damped harmonic oscillators
 * (https://en.wikipedia.org/wiki/Harmonic_oscillator#Damped_harmonic_oscillator).
 */
export class SpringController implements ReactiveController {
  private _host: ReactiveControllerHost & HTMLElement;

  protected _spring: Spring;
  private _toValue: number;

  constructor(
    host: ReactiveControllerHost & HTMLElement,
    options?: SpringConfig
  ) {
    (this._host = host).addController(this);
    this._toValue = options?.toValue ?? 0;
    this._spring = new Spring(options);
    this._spring.onUpdate(() => this._host.requestUpdate());
  }

  get currentValue() {
    return this._spring.currentValue;
  }

  /**
   * The spring's current velocity in units / ms.
   */
  get currentVelocity(): number {
    return this._spring.currentVelocity;
  }

  /**
   * If the spring has reached its `toValue`, or if its velocity is below the
   * `restVelocityThreshold`, it is considered at rest. If `stop()` is called
   * during a simulation, both `isAnimating` and `isAtRest` will be false.
   */
  get isAtRest(): boolean {
    return this._spring.isAtRest;
  }

  /**
   * Whether or not the spring is currently emitting values.
   *
   * Note: this is distinct from whether or not it is at rest.
   * See also `isAtRest`.
   */
  get isAnimating(): boolean {
    return this._spring.isAnimating;
  }

  get toValue() {
    return this._toValue;
  }

  set toValue(toValue: number) {
    this._toValue = toValue;
    this._spring.updateConfig({toValue});
    if (this._host.isConnected) {
      this._spring.start();
    }
  }

  hostConnected() {
    this._spring.start();
  }

  hostDisconnected() {
    this._spring.stop();
  }
}

export interface Position2D {
  x: number;
  y: number;
}

export interface Spring2DConfig
  extends Omit<SpringConfig, 'fromValue' | 'toValue'> {
  toPosition?: Position2D;
  fromPosition?: Position2D;
}

/**
 * A reactive controller that implements a 2D spring physics simulation by
 * combining two 1D spring controllers.
 */
export class SpringController2D implements ReactiveController {
  // TODO(justinfagnani): rather than using two springs, should we use one
  // spring with a length equal to the magnitude of the position vector?
  private _xSpring: SpringController;
  private _ySpring: SpringController;

  _toPosition: Position2D;

  constructor(
    host: ReactiveControllerHost & HTMLElement,
    options?: Spring2DConfig
  ) {
    this._toPosition = options?.toPosition ?? {x: 0, y: 0};
    this._xSpring = new SpringController(host, {
      ...options,
      fromValue: options?.fromPosition?.x,
      toValue: this._toPosition.x,
    });
    this._ySpring = new SpringController(host, {
      ...options,
      fromValue: options?.fromPosition?.y,
      toValue: this._toPosition.y,
    });
  }

  get currentPosition(): Position2D {
    return {x: this._xSpring.currentValue, y: this._ySpring.currentValue};
  }

  /**
   * The spring's current velocity in units / ms.
   */
  // TODO(justinfagnani): should velocity be a vector?
  get currentVelocity(): number {
    const dx = this._xSpring.currentVelocity;
    const dy = this._ySpring.currentVelocity;
    return Math.sqrt(dx ** 2 + dy ** 2);
  }

  /**
   * If the spring has reached its `toValue`, or if its velocity is below the
   * `restVelocityThreshold`, it is considered at rest. If `stop()` is called
   * during a simulation, both `isAnimating` and `isAtRest` will be false.
   */
  get isAtRest(): boolean {
    return this._xSpring.isAtRest && this._ySpring.isAtRest;
  }

  /**
   * Whether or not the spring is currently emitting values.
   *
   * Note: this is distinct from whether or not it is at rest.
   * See also {@link isAtRest}.
   */
  get isAnimating(): boolean {
    return this._xSpring.isAnimating || this._ySpring.isAnimating;
  }

  get toPosition() {
    return this._toPosition;
  }

  set toPosition(v: Position2D) {
    this._toPosition = v;
    this._xSpring.toValue = v.x;
    this._ySpring.toValue = v.y;
  }

  hostConnected() {
    this._xSpring.hostConnected();
    this._ySpring.hostConnected();
  }

  hostDisconnected() {
    this._xSpring.hostDisconnected();
    this._ySpring.hostDisconnected();
  }
}
