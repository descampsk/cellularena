import { Direction } from './Entity'
import { type SimplePoint } from './Point'

export function minBy<T>(
  array: T[],
  callback: (value: T) => number,
): { minObj: T | null; minIndex: number | null; minValue: number } {
  let min = Infinity
  let minObj = null
  let minIndex = null
  for (const [index, a] of array.entries()) {
    const val = callback(a)
    if (val < min) {
      min = val
      minObj = a
      minIndex = index
    }
  }
  return { minObj, minIndex, minValue: min }
}

export function maxBy<T>(
  array: T[],
  callback: (value: T) => number,
): { maxObj: T | null; maxIndex: number | null; maxValue: number | null } {
  let maxValue = -1 * Infinity
  let maxObj = null
  let maxIndex = null
  for (const [index, a] of array.entries()) {
    const val = callback(a)
    if (val > maxValue) {
      maxValue = val
      maxObj = a
      maxIndex = index
    }
  }
  return { maxObj, maxValue, maxIndex }
}

export const getDirection = (from: SimplePoint, to: SimplePoint): Direction => {
  const dx = to.x - from.x
  const dy = to.y - from.y

  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? Direction.E : Direction.W
  }

  return dy > 0 ? Direction.S : Direction.N
}

export const AllDxDy = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
]
