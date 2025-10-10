export class LRUCache<K, V> extends Map<K, V> {
  constructor(public readonly maxSize: number) {
    if (maxSize <= 0) {
      throw new Error('maxSize must be greater than 0');
    }
    super();
  }

  override set(key: K, value: V): this {
    super.delete(key);
    super.set(key, value);
    if (this.size > this.maxSize) {
      const keyToDelete = this.keys().next().value;
      if (keyToDelete) {
        this.delete(keyToDelete);
      }
    }
    return this;
  }

  override get(key: K): V | undefined {
    const value = super.get(key);
    if (value) {
      // Deleting and setting the value again ensures the key is at the end of the LRU queue
      this.delete(key);
      this.set(key, value);
    }
    return value;
  }
}
