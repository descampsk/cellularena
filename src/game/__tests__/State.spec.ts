import { describe, it, expect, beforeEach } from 'vitest'
import { State } from '../State'
import { Direction, Entity, EntityType, Owner } from '../Entity'
import { GrowAction, WaitAction } from '../Actions'

describe('State', () => {
  let state: State

  beforeEach(() => {
    state = new State()
    state.setMapSize('10 10')
  })

  describe('initialization', () => {
    it('sets map size correctly', () => {
      expect(state.width).toBe(10)
      expect(state.height).toBe(10)
    })

    it('initializes with default values', () => {
      expect(state.turn).toBe(1)
      expect(state.nextOrganId).toBe(0)
      expect(state.entities).toEqual([])
      expect(state.proteins).toEqual([])
    })
  })

  describe('state management', () => {
    it('refreshes state from inputs correctly', () => {
      const inputs = [
        '2', // entity count
        '1 1 ROOT 1 1 N 0 1', // entity 1
        '2 2 BASIC 1 2 E 1 1', // entity 2
        '1 1 1 1', // player 1 proteins
        '0 0 0 0', // player 2 proteins
        '1', // required actions
      ]
      state.refreshState(inputs)

      expect(state.entities).toHaveLength(2)
      expect(state.proteinsPerPlayer[Owner.ONE]).toEqual({ A: 1, B: 1, C: 1, D: 1 })
      expect(state.proteinsPerPlayer[Owner.TWO]).toEqual({ A: 0, B: 0, C: 0, D: 0 })
    })
  })

  describe('entity management', () => {
    it('gets entity at position correctly', () => {
      const inputs = ['1', '1 1 ROOT 0 1 N 0 1', '0 0 0 0', '0 0 0 0', '1']
      state.refreshState(inputs)

      const entity = state.getEntityAt({ x: 1, y: 1 })
      expect(entity.type).toBe(EntityType.ROOT)
      expect(entity.owner).toBe(Owner.ONE)
    })

    it('returns empty entity for invalid positions', () => {
      const entity = state.getEntityAt({ x: 0, y: 0 })
      expect(entity.type).toBe(EntityType.EMPTY)
      expect(entity.owner).toBe(Owner.NONE)
    })
  })

  describe('action handling', () => {
    beforeEach(() => {
      state.refreshState([
        '1',
        '1 1 ROOT 1 1 N 0 1',
        '5 5 5 5', // Enough proteins for any action
        '0 0 0 0',
        '1',
      ])
    })

    it('applies grow action correctly', () => {
      const growAction = new GrowAction(
        Owner.ONE,
        1,
        1,
        { x: 2, y: 1 },
        EntityType.BASIC,
        Direction.E,
      )

      state.applyAction(growAction)
      const newEntity = state.getEntityAt({ x: 2, y: 1 })
      expect(newEntity.type).toBe(EntityType.BASIC)
      expect(newEntity.owner).toBe(Owner.ONE)
    })

    it('handles wait action', () => {
      const waitAction = new WaitAction(Owner.ONE, 1)
      expect(() => state.applyAction(waitAction)).not.toThrow()
    })

    it('throws error when trying to grow without enough proteins', () => {
      state.proteinsPerPlayer[Owner.ONE] = { A: 0, B: 0, C: 0, D: 0 }
      const growAction = new GrowAction(
        Owner.ONE,
        1,
        1,
        { x: 2, y: 1 },
        EntityType.BASIC,
        Direction.E,
      )

      expect(() => state.applyAction(growAction)).toThrow()
    })
  })

  describe('protein handling', () => {
    it('identifies proteins correctly', () => {
      expect(state.isProtein(EntityType.A)).toBe(true)
      expect(state.isProtein(EntityType.BASIC)).toBe(false)
    })

    it('handles protein harvesting correctly', () => {
      state.refreshState([
        '2',
        '1 1 HARVESTER 0 1 E 0 1',
        '2 1 A 0 0 X 0 0',
        '0 0 0 0',
        '0 0 0 0',
        '1',
      ])

      state.refreshProteins()
      expect(state.proteinGainsPerPlayer[Owner.ONE].A).toBe(1)
    })
  })

  describe('tentacle attacks', () => {
    it('handles tentacle attacks correctly', () => {
      state.refreshState([
        '2',
        '1 1 TENTACLE 1 1 E 0 1',
        '2 1 BASIC 2 2 X 0 2',
        '0 0 0 0',
        '0 0 0 0',
        '1',
      ])

      state.doTentacleAttacks()
      const targetPosition = state.getEntityAt({ x: 2, y: 1 })
      expect(targetPosition.type).toBe(EntityType.EMPTY)
    })
  })

  describe('neighbor calculations', () => {
    it('gets valid neighbors correctly', () => {
      const neighbors = state.getNeighbours({ x: 1, y: 1 })
      expect(neighbors).toHaveLength(4)
    })

    it('filters wall neighbors', () => {
      state.refreshState(['1', '0 1 WALL 0 0 X 0 0', '0 0 0 0', '0 0 0 0', '1'])

      const neighbors = state.getNeighboursButWall({ x: 1, y: 1 })
      expect(neighbors).toHaveLength(3)
    })
  })

  describe('AI input generation', () => {
    it('creates correct AI inputs', () => {
      state.refreshState(['1', '1 1 ROOT 1 1 N 0 1', '1 1 1 1', '0 0 0 0', '1'])

      const aiInputs = state.createInputsForAI(Owner.ONE)
      expect(aiInputs).toHaveLength(6)
      expect(aiInputs[0]).toBe('10 10')
      expect(aiInputs[1]).toBe('1')
    })
  })

  describe('wall collisions', () => {
    it('handles wall collisions correctly', () => {
      const entity = {
        x: 1,
        y: 1,
        type: EntityType.BASIC,
        owner: Owner.ONE,
        organId: 1,
        organDir: Direction.N,
        organParentId: 0,
        oldEntity: {
          type: EntityType.WALL,
          owner: Owner.NONE,
          organId: 0,
          organDir: Direction.X,
          organParentId: 0,
        },
      } as Entity
      state.entities = [entity]
      state.doWallCollisions()
      expect(entity.type).toBe(EntityType.WALL)
      expect(entity.owner).toBe(Owner.NONE)
    })
  })
})
