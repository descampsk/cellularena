import { beforeEach, describe, expect, it } from 'vitest'
import { EndGameChecker } from '../EndGameChecker'
import { Entity, Owner } from '../Entity'
import { State } from '../State'

describe('EndGameChecker', () => {
  let state: State
  beforeEach(() => {
    state = new State()
  })

  it('returns null when game is not finished before 50 turns', () => {
    state.turn = 49
    state.entities = [{ owner: Owner.ONE }, { owner: Owner.TWO }] as Entity[]
    state.proteinsPerPlayer = {
      [Owner.ONE]: { A: 0, B: 0, C: 0, D: 10 },
      [Owner.TWO]: { A: 20, B: 0, C: 0, D: 10 },
    }

    const checker = new EndGameChecker(state)
    expect(checker.checkWinner()).toBeNull()
  })

  it('returns winner when opponent has no entities left', () => {
    state.turn = 49
    state.entities = [{ owner: Owner.ONE }, { owner: Owner.ONE }] as Entity[]
    state.proteinsPerPlayer = {
      [Owner.ONE]: { A: 0, B: 0, C: 0, D: 10 },
      [Owner.TWO]: { A: 20, B: 0, C: 0, D: 10 },
    }

    const checker = new EndGameChecker(state)
    expect(checker.checkWinner()).toBe(Owner.ONE)
  })

  it('returns winner with more entities after 50 turns', () => {
    state.turn = 50
    state.entities = [{ owner: Owner.ONE }, { owner: Owner.ONE }, { owner: Owner.TWO }] as Entity[]
    state.proteinsPerPlayer = {
      [Owner.ONE]: { A: 0, B: 0, C: 0, D: 10 },
      [Owner.TWO]: { A: 20, B: 0, C: 0, D: 10 },
    }

    const checker = new EndGameChecker(state)
    expect(checker.checkWinner()).toBe(Owner.ONE)
  })

  it('returns winner with more proteins when entities are equal after 50 turns', () => {
    state.turn = 50
    state.entities = [{ owner: Owner.ONE }, { owner: Owner.TWO }] as Entity[]
    state.proteinsPerPlayer = {
      [Owner.ONE]: { A: 0, B: 5, C: 5, D: 10 },
      [Owner.TWO]: { A: 20, B: 0, C: 0, D: 10 },
    }

    const checker = new EndGameChecker(state)
    expect(checker.checkWinner()).toBe(Owner.TWO)
  })

  it('returns draw when entities and proteins are equal after 50 turns', () => {
    state.turn = 50
    state.entities = [{ owner: Owner.ONE }, { owner: Owner.TWO }] as Entity[]
    state.proteinsPerPlayer = {
      [Owner.ONE]: { A: 10, B: 5, C: 5, D: 10 },
      [Owner.TWO]: { A: 20, B: 0, C: 0, D: 10 },
    }

    const checker = new EndGameChecker(state)
    expect(checker.checkWinner()).toBe(Owner.NONE)
  })
})
