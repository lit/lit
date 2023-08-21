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
  extends Omit<SpringConfig, 'fromValue' | 'toValue'> {
  toPosition?: Position2D;
  fromPosition?: Position2D;
}

const magnitude = ({x, y}: Position2D) => Math.sqrt(x ** 2 + y ** 2);
const sum = (a: Position2D, b: Position2D): Position2D => ({
  x: a.x + b.x,
  y: a.y + b.y,
});
const difference = (a: Position2D, b: Position2D): Position2D => ({
  x: a.x - b.x,
  y: a.y - b.y,
});
const scale = (a: Position2D, s: number): Position2D => ({
  x: a.x * s,
  y: a.y * s,
});

/**
 * A reactive controller that implements a 2D spring physics simulation.
 *
 * The 2D spring is modeled with a 1D spring mapped to the vector from
 * `fromPosition` to `toPosition`.
 */
export class SpringController2D implements ReactiveController {
  private _spring: SpringController;

  private _toPosition: Position2D;
  private _fromPosition: Position2D;

  constructor(
    host: ReactiveControllerHost & HTMLElement,
    options?: Spring2DConfig
  ) {
    const fromPosition = (this._fromPosition = options?.fromPosition ?? {
      x: 0,
      y: 0,
    });
    const toPosition = (this._toPosition = options?.toPosition ?? {x: 1, y: 1});
    // Vector from toPosition to fromPosition
    const deltaPosition = difference(toPosition, fromPosition);
    const toValue = magnitude(deltaPosition);

    this._spring = new SpringController(host, {
      ...options,
      fromValue: 0,
      toValue,
    });
  }

  get currentPosition(): Position2D {
    // Vector from toPosition to fromPosition
    const initialDeltaPosition = difference(
      this._toPosition,
      this._fromPosition
    );
    const initialDistance = magnitude(initialDeltaPosition);
    const {currentValue} = this._spring;
    const currentDeltaPosition = scale(
      initialDeltaPosition,
      currentValue / initialDistance
    );
    const currentPosition = sum(this._toPosition, currentDeltaPosition);
    return currentPosition;
  }

  /**
   * The spring's current velocity in units / ms.
   */
  get currentVelocity(): Position2D {
    const currentVelocityMagnitude = this._spring.currentVelocity;
    const initialDeltaPosition = difference(
      this._toPosition,
      this._fromPosition
    );
    const initialDeltaMagnitude = magnitude(initialDeltaPosition);
    // Unit vector in the direction of fromPosition to toPosition
    const initialDirection = scale(
      initialDeltaPosition,
      1 / initialDeltaMagnitude
    );
    const currentVelocity = scale(initialDirection, currentVelocityMagnitude);

    return currentVelocity;
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
   * See also {@link isAtRest}.
   */
  get isAnimating(): boolean {
    return this._spring.isAnimating;
  }

  get toPosition() {
    return this._toPosition;
  }

  set toPosition(v: Position2D) {
    const toPosition = (this._toPosition = v);
    const deltaPosition = difference(toPosition, this._fromPosition);
    const toValue = magnitude(deltaPosition);

    this._spring.toValue = toValue;
  }

  hostConnected() {
    this._spring.hostConnected();
  }

  hostDisconnected() {
    this._spring.hostDisconnected();
  }
}
