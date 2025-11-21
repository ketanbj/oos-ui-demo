export class DeterministicRNG {
  private seed: number

  constructor(seed = 1337) {
    this.seed = seed >>> 0
  }

  next() {
    this.seed = (1664525 * this.seed + 1013904223) % 4294967296
    return this.seed / 4294967296
  }

  range(min: number, max: number) {
    return min + (max - min) * this.next()
  }

  pick<T>(items: T[]): T {
    return items[Math.floor(this.next() * items.length)]
  }
}
