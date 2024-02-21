/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

export const tau = 2 * Math.PI;

export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export type Point2D = [number, number];

/**
 * Scales a point on the unit square, `p`, to the given Rect.
 */
export const locate = (rect: Rect, p: Point2D): Point2D => {
  return [rect.left + rect.width * p[0], rect.top + rect.height * p[1]];
};

/**
 * Ensures a number stays within a minimum and maximum value
 */
export const clamp = (x: number, min: number, max: number) =>
  Math.min(Math.max(min, x), max);

// export const angle = (p: Point2D) => {
//   const t = Math.atan(p[1] / p[0]);
//   return p[0] < 0 ? t + Math.PI : p[1] < 0 ? t + tau : t;
// };

// export const radToDeg = (rad: number) => (rad / tau) * 360;

// export const degToRad = (deg: number) => (deg * tau) / 360;

// export const rotate = (radians: number, p: Point2D): Point2D => {
//   const cos = Math.cos(radians);
//   const sin = Math.sin(radians);
//   return [p[0] * cos - p[1] * sin, p[0] * sin + p[1] * cos];
// };

export const translate = (a: Point2D, b: Point2D): Point2D => {
  return [a[0] + b[0], a[1] + b[1]];
};

export const scale = (m: number, p: Point2D): Point2D => {
  return [m * p[0], m * p[1]];
};
