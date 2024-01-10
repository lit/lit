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
