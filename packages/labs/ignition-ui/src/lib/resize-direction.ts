/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {Point2D} from './math.js';

export type DirectionName =
  | 'top'
  | 'left'
  | 'bottom'
  | 'right'
  | 'top_left'
  | 'top_right'
  | 'bottom_left'
  | 'bottom_right';

/**
 * The position and resize constraints of a resize handle as used in a
 * resizable UI component like `<ignition-selector>`.
 *
 * The `x` and `y` properties are the position of the handle in the range
 * [0, 1], representing a position as a fraction of the width and height of the
 * component the handle is attached to.
 *
 * The resizes{Left|Ritgh|Top|Bottom} methods return whether the handle resizes
 * the component in the given direction. A handle only resizes the left of the
 * component if its x position is 0.0, and only resizes the right if its x
 * position is 1.0.
 */
export class ResizeDirection {
  /**
   * Returns the built-in ResizeDirection of the given name.
   */
  static getDirection(name: DirectionName): ResizeDirection {
    return ResizeDirection[name];
  }

  static top = new ResizeDirection('top', 0.5, 0.0);
  static left = new ResizeDirection('left', 0.0, 0.5);
  static bottom = new ResizeDirection('bottom', 0.5, 1.0);
  static right = new ResizeDirection('right', 1.0, 0.5);
  static top_left = new ResizeDirection('top_left', 0.0, 0.0);
  static top_right = new ResizeDirection('top_right', 1.0, 0.0);
  static bottom_left = new ResizeDirection('bottom_left', 0.0, 1.0);
  static bottom_right = new ResizeDirection('bottom_right', 1.0, 1.0);

  static ALL_DIRECTIONS = [
    ResizeDirection.top,
    ResizeDirection.left,
    ResizeDirection.bottom,
    ResizeDirection.right,
    ResizeDirection.top_left,
    ResizeDirection.top_right,
    ResizeDirection.bottom_left,
    ResizeDirection.bottom_right,
  ];
  static WIDTH_HEIGHT = [
    ResizeDirection.bottom,
    ResizeDirection.right,
    ResizeDirection.bottom_right,
  ];

  name: DirectionName;

  /**
   * The x position in the range [0, 1]
   */
  x: number;

  /**
   * The y position in the range [0, 1]
   */
  y: number;

  get location(): Point2D {
    return [this.x, this.y];
  }

  constructor(name: DirectionName, x: number, y: number) {
    this.name = name;
    this.x = x;
    this.y = y;
  }

  get resizesLeft() {
    return this.x === 0.0;
  }

  get resizesRight() {
    return this.x === 1.0;
  }

  get resizesTop() {
    return this.y === 0.0;
  }

  get resizesBottom() {
    return this.y === 1.0;
  }

  toString() {
    return `ResizeDirection(${this.name}, ${this.x}, '${this.y})`;
  }
}
