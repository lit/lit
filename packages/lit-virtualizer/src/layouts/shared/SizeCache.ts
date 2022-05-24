export interface SizeCacheConfig {
    roundAverageSize?: boolean
}

export class SizeCache {
    private _map: Map<number | string, number> = new Map();
    private _roundAverageSize = true;
    totalSize = 0;

    constructor(config?: SizeCacheConfig) {
        if (config?.roundAverageSize === false) {
            this._roundAverageSize = false;
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
            return this._roundAverageSize
            ? Math.round(average)
            : average;
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