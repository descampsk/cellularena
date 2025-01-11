import { type OrganType } from './State'
import { Direction, EntityType, Owner } from './Entity'
import { type SimplePoint } from './Point'
import type { FirestoreDataConverter, QueryDocumentSnapshot } from 'firebase/firestore'
import { v4 } from 'uuid'

export type IAction = {
  id: string
  actionType: 'GROW' | 'SPORE' | 'WAIT'
  turn: number
  target?: SimplePoint
  output: () => string
}

export class GrowAction implements IAction {
  public id = v4()

  public actionType: 'GROW' | 'SPORE' | 'WAIT' = 'GROW'

  constructor(
    public playerId: Owner.ONE | Owner.TWO,
    public turn: number,
    public organId: number,
    public target: SimplePoint,
    public type: OrganType,
    public direction: Direction,
    public message?: string,
  ) {}

  output() {
    return `GROW ${this.organId} ${this.target.x} ${this.target.y} ${this} ${this.direction} ${this.message || ''}`
  }
}

export class SporeAction implements IAction {
  public id = v4()

  type = EntityType.ROOT

  direction = Direction.X

  public actionType: 'GROW' | 'SPORE' | 'WAIT' = 'SPORE'

  constructor(
    public playerId: Owner.ONE | Owner.TWO,
    public turn: number,
    public organId: number,
    public target: SimplePoint,
    public message?: string,
  ) {}

  output() {
    return `SPORE ${this.organId} ${this.target.x} ${this.target.y} ${this.message || ''}`
  }
}

export class WaitAction implements IAction {
  public id = v4()

  public actionType: 'GROW' | 'SPORE' | 'WAIT' = 'WAIT'

  constructor(
    public playerId: Owner.ONE | Owner.TWO,
    public turn: number,
  ) {}
  target?: SimplePoint | undefined

  output() {
    return `WAIT`
  }

  apply() {
    // No state changes for wait action
  }
}

export const actionFirestoreConvertor: FirestoreDataConverter<
  GrowAction | WaitAction | SporeAction
> = {
  toFirestore: (action: GrowAction | SporeAction | WaitAction) => {
    const { turn, playerId, id } = action
    if (action instanceof WaitAction) {
      return {
        id,
        actionType: 'WAIT',
        playerId,
        turn,
      }
    }

    const actionType = action instanceof GrowAction ? 'GROW' : 'SPORE'
    const { direction, organId, target, type } = action
    return {
      id,
      actionType,
      playerId,
      turn,
      direction,
      organId,
      x: target.x,
      y: target.y,
      type,
    }
  },

  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data()
    const { id } = snapshot
    const { actionType, turn, playerId } = data
    let action: GrowAction | WaitAction | SporeAction
    if (actionType === 'WAIT') {
      action = new WaitAction(playerId, turn)
    } else {
      const { direction, organId, x, y, type } = data

      if (actionType === 'SPORE') {
        action = new SporeAction(playerId, turn, organId, { x, y })
      } else {
        action = new GrowAction(playerId, turn, organId, { x, y }, type, direction)
      }
    }

    action.id = id
    return action
  },
}

export type Action = GrowAction | SporeAction | WaitAction
