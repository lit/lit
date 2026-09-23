/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

export interface SizeCacheConfig {
  roundAverageSize?: boolean;
}

export class SizeCache {
  private _map = new Map<number | string, number>();
  private _roundAverageSize = false;
  totalSize = 0;

  constructor(config?: SizeCacheConfig) {
    if (config?.roundAverageSize === true) {
      this._roundAverageSize = true;
    }
  }

  set(index: number | string, value: number): void {
    const prev = this._map.get(index) || 0;
    this._map.set(index, value);
    this.totalSize += value - prev;
  }

  /**
   * Drops all cached numeric-indexed entries at or beyond `length`, keeping
   * `totalSize` and the entry count (used by `averageSize`) in sync. Called when
   * the item list shrinks so measurements for removed items no longer skew the
   * average.
   */
  prune(length: number): void {
    for (const key of [...this._map.keys()]) {
      if (typeof key === 'number' && key >= length) {
        this.totalSize -= this._map.get(key)!;
        this._map.delete(key);
      }
    }
  }

  get averageSize(): number {
    if (this._map.size > 0) {
      const average = this.totalSize / this._map.size;
      return this._roundAverageSize ? Math.round(average) : average;
    }
    return 0;
  }

  getSize(index: number | string) {
    return this._map.get(index);
  }

  clear() {
    this._map.clear();
    this.totalSize = 0;
  }
}
