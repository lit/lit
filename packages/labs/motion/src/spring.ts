/**
 * @license
 * Copyright The Lit Project
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
  private _fromValue: number;

  constructor(
    host: ReactiveControllerHost & HTMLElement,
    options?: SpringConfig
  ) {
    (this._host = host).addController(this);
    this._fromValue = options?.fromValue ?? 0;
    this._toValue = options?.toValue ?? 1;
    this._spring = new Spring(options);
    this._spring.onUpdate(() => this._host.requestUpdate());
    if (this._host.isConnected) {
      this._spring.start();
    }
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

  get fromValue() {
    return this._fromValue;
  }

  set fromValue(fromValue: number) {
    this._fromValue = fromValue;
    this._spring.updateConfig({fromValue});
    if (this._host.isConnected) {
      this._spring.start();
    }
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
    this._spring?.start();
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
  extends Omit<SpringConfig, 'fromValue' | 'toValue' | 'initialVelocity'> {
  toPosition?: Position2D;
  fromPosition?: Position2D;
  initialVelocity?: Position2D;
}

/**
 * A reactive controller that implements a 2D spring physics simulation.
 *
 * The 2D spring is modeled with two 1D springs, one for each axis.
 */
export class SpringController2D implements ReactiveController {
  private _springX: SpringController;
  private _springY: SpringController;

  constructor(
    host: ReactiveControllerHost & HTMLElement,
    options?: Spring2DConfig
  ) {
    const {
      fromPosition = {x: 0, y: 0},
      toPosition = {x: 1, y: 1},
      initialVelocity = {x: 0, y: 0},
      ...rest
    } = options || {};

    this._springX = new SpringController(host, {
      ...rest,
      fromValue: fromPosition.x,
      toValue: toPosition.x,
      initialVelocity: initialVelocity.x,
    });

    this._springY = new SpringController(host, {
      ...rest,
      fromValue: fromPosition.y,
      toValue: toPosition.y,
      initialVelocity: initialVelocity.y,
    });
  }

  get currentPosition(): Position2D {
    return {
      x: this._springX.currentValue,
      y: this._springY.currentValue,
    };
  }

  /**
   * The spring's current velocity in units / ms.
   */
  get currentVelocity(): Position2D {
    return {
      x: this._springX.currentVelocity,
      y: this._springY.currentVelocity,
    };
  }

  /**
   * If the spring has reached its `toValue`, or if its velocity is below the
   * `restVelocityThreshold`, it is considered at rest. If `stop()` is called
   * during a simulation, both `isAnimating` and `isAtRest` will be false.
   */
  get isAtRest(): boolean {
    return this._springX.isAtRest && this._springY.isAtRest;
  }

  /**
   * Whether or not the spring is currently emitting values.
   *
   * Note: this is distinct from whether or not it is at rest.
   * See also {@link isAtRest}.
   */
  get isAnimating(): boolean {
    return this._springX.isAnimating || this._springY.isAnimating;
  }

  get toPosition() {
    return {
      x: this._springX.toValue,
      y: this._springY.toValue,
    };
  }

  set toPosition(v: Position2D) {
    this._springX.toValue = v.x;
    this._springY.toValue = v.y;
  }

  hostConnected() {
    this._springX.hostConnected();
    this._springY.hostConnected();
  }

  hostDisconnected() {
    this._springX.hostDisconnected();
    this._springY.hostDisconnected();
  }
}
