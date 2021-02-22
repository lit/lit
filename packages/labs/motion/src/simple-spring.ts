/**
 * Copyright 2017 Adam Miskiewicz

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
// Simplified from https://github.com/skevy/wobble/blob/develop/src/index.ts.

export interface SpringConfig {
  stiffness: number; // The spring stiffness coefficient.
  damping: number; // Defines how the spring’s motion should be damped due to the forces of friction.
  mass: number; // The mass of the object attached to the end of the spring.
  initialVelocity: number; // The initial velocity (in units/ms) of the object attached to the spring.
  allowsOverdamping: boolean; // Whether or not the spring allows "overdamping" (a damping ratio > 1). Defaults to false.
  overshootClamping: boolean; // False when overshooting is allowed, true when it is not. Defaults to false.
  restVelocityThreshold: number; // When spring's velocity is below `restVelocityThreshold`, it is at rest. Defaults to .001.
  restDisplacementThreshold: number; // When the spring's displacement (current value) is below `restDisplacementThreshold`, it is at rest. Defaults to .001.
}

export type PartialSpringConfig = Partial<SpringConfig>;

export class SimpleSpring {
  DELTA_TIME = (1 / 60) * 1000;

  private _config: SpringConfig;

  private _currentTime = 0; // Current timestamp of animation in ms (real time)
  private _springTime = 0; // Current time along the spring curve in ms (zero-based)

  private _currentValue = 0; // the current value of the spring
  private _currentVelocity = 0; // the current velocity of the spring
  private _isAnimating = false;
  values: number[] = [];

  constructor(config: PartialSpringConfig = {}) {
    this._config = {
      stiffness: config.stiffness ?? 100,
      damping: config.damping ?? 10,
      mass: config.mass ?? 1,
      initialVelocity: config.initialVelocity ?? 0,
      overshootClamping: config.overshootClamping ?? false,
      allowsOverdamping: config.allowsOverdamping ?? false,
      restVelocityThreshold: config.restVelocityThreshold ?? 0.001,
      restDisplacementThreshold: config.restDisplacementThreshold ?? 0.001,
    };
    this._currentValue = 0;
    this._currentVelocity = this._config.initialVelocity;
    let frames = 0;
    while (!this._isSpringAtRest()) {
      this._advanceSpringToTime(frames++ * this.DELTA_TIME);
      this.values.push(this._currentValue);
    }
  }

  private _advanceSpringToTime(timestamp: number) {
    this._springTime += timestamp - this._currentTime;

    const c = this._config.damping;
    const m = this._config.mass;
    const k = this._config.stiffness;
    const fromValue = 0;
    const toValue = 1;
    const v0 = -this._config.initialVelocity;

    let zeta = c / (2 * Math.sqrt(k * m)); // damping ratio (dimensionless)
    const omega0 = Math.sqrt(k / m) / 1000; // undamped angular frequency of the oscillator (rad/ms)
    const omega1 = omega0 * Math.sqrt(1.0 - zeta * zeta); // exponential decay
    const omega2 = omega0 * Math.sqrt(zeta * zeta - 1.0); // frequency of damped oscillation
    const x0 = toValue - fromValue; // initial displacement of the spring at t = 0

    if (zeta > 1 && !this._config.allowsOverdamping) {
      zeta = 1;
    }

    let oscillation = 0.0;
    let velocity = 0.0;
    const t = this._springTime;
    if (zeta < 1) {
      // Under damped
      const envelope = Math.exp(-zeta * omega0 * t);
      oscillation =
        toValue -
        envelope *
          (((v0 + zeta * omega0 * x0) / omega1) * Math.sin(omega1 * t) +
            x0 * Math.cos(omega1 * t));
      // This looks crazy -- it's actually just the derivative of the
      // oscillation function
      velocity =
        zeta *
          omega0 *
          envelope *
          ((Math.sin(omega1 * t) * (v0 + zeta * omega0 * x0)) / omega1 +
            x0 * Math.cos(omega1 * t)) -
        envelope *
          (Math.cos(omega1 * t) * (v0 + zeta * omega0 * x0) -
            omega1 * x0 * Math.sin(omega1 * t));
    } else if (zeta === 1) {
      // Critically damped
      const envelope = Math.exp(-omega0 * t);
      oscillation = toValue - envelope * (x0 + (v0 + omega0 * x0) * t);
      velocity =
        envelope * (v0 * (t * omega0 - 1) + t * x0 * (omega0 * omega0));
    } else {
      // Overdamped
      const envelope = Math.exp(-zeta * omega0 * t);
      oscillation =
        toValue -
        (envelope *
          ((v0 + zeta * omega0 * x0) * Math.sinh(omega2 * t) +
            omega2 * x0 * Math.cosh(omega2 * t))) /
          omega2;
      velocity =
        (envelope *
          zeta *
          omega0 *
          (Math.sinh(omega2 * t) * (v0 + zeta * omega0 * x0) +
            x0 * omega2 * Math.cosh(omega2 * t))) /
          omega2 -
        (envelope *
          (omega2 * Math.cosh(omega2 * t) * (v0 + zeta * omega0 * x0) +
            omega2 * omega2 * x0 * Math.sinh(omega2 * t))) /
          omega2;
    }

    this._currentTime = timestamp;
    this._currentValue = oscillation;
    this._currentVelocity = velocity;

    if (!this._isAnimating) {
      return;
    }

    // If the Spring is overshooting (when overshoot clamping is on), or if the
    // spring is at rest (based on the thresholds set in the config), stop the
    // animation.
    if (this._isSpringOvershooting() || this._isSpringAtRest()) {
      if (k !== 0) {
        // Ensure that we end up with a round value
        this._currentValue = toValue;
        this._currentVelocity = 0;
      }
      return;
    }
  }

  private _isSpringOvershooting() {
    const {stiffness, overshootClamping} = this._config;
    let isOvershooting = false;
    if (overshootClamping && stiffness !== 0) {
      isOvershooting = this._currentValue > 1;
    }
    return isOvershooting;
  }

  private _isSpringAtRest() {
    const {
      stiffness,
      restDisplacementThreshold,
      restVelocityThreshold,
    } = this._config;

    const isNoVelocity =
      Math.abs(this._currentVelocity) <= restVelocityThreshold;
    const isNoDisplacement =
      stiffness !== 0 &&
      Math.abs(1 - this._currentValue) <= restDisplacementThreshold;
    return isNoDisplacement && isNoVelocity;
  }
}
