export type SimplePoint = { x: number; y: number }

export class Point implements SimplePoint {
  constructor(
    public x: number,
    public y: number,
  ) {}

  add(p: SimplePoint) {
    return Point.sum(this, p)
  }

  subtract(p: SimplePoint) {
    return Point.difference(this, p)
  }

  round() {
    return new Point(Math.round(this.x), Math.round(this.y))
  }

  get unitVector() {
    return this.scale(1 / this.length)
  }

  scale(sx: number, sy = sx) {
    return new Point(this.x * sx, this.y * sy)
  }

  shift(x: number, y = x) {
    return new Point(this.x + x, this.y + y)
  }

  rotate(angle: number, c: SimplePoint = { x: 0, y: 0 }) {
    const x0 = this.x - c.x
    const y0 = this.y - c.y

    const cos = Math.cos(angle)
    const sin = Math.sin(angle)

    const x = x0 * cos - y0 * sin + c.x
    const y = x0 * sin + y0 * cos + c.y
    return new Point(x, y)
  }

  get length() {
    return Math.sqrt(this.x ** 2 + this.y ** 2)
  }

  static sum(p1: SimplePoint, p2: SimplePoint) {
    return new Point(p1.x + p2.x, p1.y + p2.y)
  }

  static difference(p1: SimplePoint, p2: SimplePoint) {
    return new Point(p1.x - p2.x, p1.y - p2.y)
  }

  /** Returns the Euclidean distance between two points p1 and p2. */
  static distance(p1: SimplePoint, p2: SimplePoint) {
    return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2)
  }

  static distanceSquared(p1: SimplePoint, p2: SimplePoint) {
    return (p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2
  }

  /** Returns the Manhattan distance between two points p1 and p2. */
  static manhattan(p1: SimplePoint, p2: SimplePoint) {
    return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y)
  }

  equals(p: SimplePoint) {
    return this.x === p.x && this.y === p.y
  }

  clone() {
    return new Point(this.x, this.y)
  }

  toString() {
    return `pt(${this.x},${this.y})`
  }
}
