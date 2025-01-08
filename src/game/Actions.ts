import {
  DirectionToDxDy,
  EntityTypeToString,
  type OrganType,
  ProteinsPerOrgan,
  type ProteinType,
  type State,
} from './State'
import { Direction, Entity, EntityType, Owner } from './Entity'
import { type SimplePoint } from './Point'

export type Action = {
  state: State
  score: number
  target?: SimplePoint
  output: () => string
  apply: () => void
}

export class GrowAction implements Action {
  typeStr: string

  score = 0

  constructor(
    public state: State,
    // public organId: number,
    public from: SimplePoint,
    public target: SimplePoint,
    public type: OrganType,
    public direction: Direction,
    public message?: string,
  ) {
    this.typeStr = EntityTypeToString[type]
  }

  output() {
    const { organId } = this.state.getEntityAt(this.from)
    return `GROW ${organId} ${this.target.x} ${this.target.y} ${this.typeStr} ${this.direction} ${this.message || ''}`
  }

  toString() {
    const { organId } = this.state.getEntityAt(this.from)
    return `GROW ${organId} ${this.target.x} ${this.target.y} ${this.typeStr} ${this.direction} ${this.score}`
  }

  equals(other: GrowAction) {
    return (
      this.from.x === other.from.x &&
      this.from.y === other.from.y &&
      this.target.x === other.target.x &&
      this.target.y === other.target.y &&
      this.type === other.type &&
      this.direction === other.direction
    )
  }

  apply() {
    const parent = this.state.myOrgans.find((o) => o.x === this.from.x && o.y === this.from.y)
    if (!parent) {
      console.error(this)
      throw new Error(`Cannot find parent organ with coordinates ${this.from.x}, ${this.from.y}`)
    }

    const newEntity = new Entity(
      this.target.x,
      this.target.y,
      this.type,
      1, // Assuming the owner is always 1 for grow actions
      this.state.nextOrganId, // Assuming the new entity has the next id
      this.direction,
      parent.organId,
      parent.type === EntityType.ROOT ? parent.organId : parent.organRootId,
    )
    newEntity.isTemporary = true
    this.state.nextOrganId += 1
    const entityAtTarget = this.state.getEntityAt(this.target)
    if (entityAtTarget.owner !== Owner.NONE) {
      throw new Error(
        `Cannot grow on top of an existing entity at ${this.target.x}, ${this.target.y}`,
      )
    }

    this.state.entities = this.state.entities.filter(
      (e) => e.x !== this.target.x || e.y !== this.target.y,
    )
    this.state.entities.push(newEntity)
    this.state.myOrgans.push(newEntity)
    this.state.grid[this.target.x + this.target.y * this.state.width] = newEntity
    const proteinsNeeded = ProteinsPerOrgan[this.type]
    for (const protein of Object.keys(proteinsNeeded)) {
      this.state.myProteins[protein as keyof typeof proteinsNeeded] -=
        proteinsNeeded[protein as keyof typeof proteinsNeeded]
    }
    if (this.type === EntityType.HARVESTER) {
      const [nx, ny] = DirectionToDxDy[this.direction]
      const harvestEntity = this.state.getEntityAt({ x: this.target.x + nx, y: this.target.y + ny })
      if (harvestEntity.isProtein) {
        harvestEntity.isAlreadyHarvested = true
        this.state.myProteinsGains[EntityTypeToString[harvestEntity.type] as ProteinType] += 1
      }
    }
  }
}

export class SporeAction implements Action {
  score = 0

  type = EntityType.ROOT

  direction = Direction.X

  constructor(
    public state: State,
    public from: SimplePoint,
    public target: SimplePoint,
    public message?: string,
  ) {}

  output() {
    const { organId } = this.state.getEntityAt(this.from)
    return `SPORE ${organId} ${this.target.x} ${this.target.y} ${this.message || ''}`
  }

  toString() {
    const { organId } = this.state.getEntityAt(this.from)
    return `SPORE ${organId} ${this.target.x} ${this.target.y} ${this.score}`
  }

  apply() {
    const newEntity = new Entity(
      this.target.x,
      this.target.y,
      EntityType.ROOT,
      1, // Assuming the owner is always 1 for spore actions
      this.state.nextOrganId, // Assuming the new entity has the next id
      Direction.X, // Assuming direction is X for spores
      0, // Parent id is always 0 for Root
      0, // Root id is always 0 for Root
    )
    newEntity.isTemporary = true
    this.state.nextOrganId += 1
    this.state.entities = this.state.entities.filter(
      (e) => e.x !== this.target.x || e.y !== this.target.y,
    )
    this.state.entities.push(newEntity)
    this.state.myOrgans.push(newEntity)
    this.state.requiredActionsCount += 1
    this.state.grid[this.target.x + this.target.y * this.state.width] = newEntity
    const proteinsNeeded = ProteinsPerOrgan[EntityType.ROOT]
    for (const protein of Object.keys(proteinsNeeded)) {
      this.state.myProteins[protein as keyof typeof proteinsNeeded] -=
        proteinsNeeded[protein as keyof typeof proteinsNeeded]
    }
  }
}

export class WaitAction implements Action {
  score = -Infinity

  constructor(
    public state: State,
    public message?: string,
  ) {}

  output() {
    return `WAIT ${this.message || ''}`
  }

  apply() {
    // No state changes for wait action
  }
}
