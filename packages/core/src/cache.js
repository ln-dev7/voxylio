// Bounded insertion-order cache — extracted from the Chrome POC.
// When the cap is exceeded, the oldest half is evicted.

export class BoundedMap extends Map {
  constructor(max = 3000) {
    super();
    this.max = max;
  }

  set(key, value) {
    if (!this.has(key) && this.size >= this.max) {
      let n = 0;
      for (const k of this.keys()) {
        this.delete(k);
        if (++n >= this.max / 2) break;
      }
    }
    return super.set(key, value);
  }
}
