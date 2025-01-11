import { getDirection } from './helpers'
import { Direction, Entity, EntityType, Owner, ProteinTypes } from './Entity'
import { type SimplePoint } from './Point'
import { WaitAction, type GrowAction, type SporeAction } from './Actions'

export const StringToEntityType = {
  EMPTY: EntityType.EMPTY,
  WALL: EntityType.WALL,
  ROOT: EntityType.ROOT,
  BASIC: EntityType.BASIC,
  HARVESTER: EntityType.HARVESTER,
  TENTACLE: EntityType.TENTACLE,
  SPORER: EntityType.SPORER,
  A: EntityType.A,
  B: EntityType.B,
  C: EntityType.C,
  D: EntityType.D,
}

export const EntityTypeToString = {
  [EntityType.EMPTY]: 'EMPTY',
  [EntityType.WALL]: 'WALL',
  [EntityType.ROOT]: 'ROOT',
  [EntityType.BASIC]: 'BASIC',
  [EntityType.HARVESTER]: 'HARVESTER',
  [EntityType.TENTACLE]: 'TENTACLE',
  [EntityType.SPORER]: 'SPORER',
  [EntityType.A]: 'A',
  [EntityType.B]: 'B',
  [EntityType.C]: 'C',
  [EntityType.D]: 'D',
}

export const AllDirections = [Direction.N, Direction.E, Direction.S, Direction.W]

export const DirectionToDxDy: Record<Direction, [number, number]> = {
  [Direction.N]: [0, -1],
  [Direction.E]: [1, 0],
  [Direction.S]: [0, 1],
  [Direction.W]: [-1, 0],
  [Direction.X]: [0, 0],
}

export const OrganTypes = [
  EntityType.ROOT,
  EntityType.BASIC,
  EntityType.HARVESTER,
  EntityType.TENTACLE,
  EntityType.SPORER,
]
export type OrganType =
  | EntityType.BASIC
  | EntityType.ROOT
  | EntityType.HARVESTER
  | EntityType.TENTACLE
  | EntityType.SPORER

export const ProteinsPerOrgan: Record<OrganType, { A: 0 | 1; B: 0 | 1; C: 0 | 1; D: 0 | 1 }> = {
  [EntityType.BASIC]: { A: 1, B: 0, C: 0, D: 0 },
  [EntityType.ROOT]: { A: 1, B: 1, C: 1, D: 1 },
  [EntityType.HARVESTER]: { A: 0, B: 0, C: 1, D: 1 },
  [EntityType.TENTACLE]: { A: 0, B: 1, C: 1, D: 0 },
  [EntityType.SPORER]: { A: 0, B: 1, C: 0, D: 1 },
}

export type ProteinType = 'A' | 'B' | 'C' | 'D'

export class State {
  public turn = 0

  public width = 0

  public height = 0

  public proteinsPerPlayer: {
    [Owner.ONE]: Record<ProteinType, number>
    [Owner.TWO]: Record<ProteinType, number>
  } = {
    [Owner.ONE]: { A: 0, B: 0, C: 0, D: 0 },
    [Owner.TWO]: { A: 0, B: 0, C: 0, D: 0 },
  }

  public proteinGainsPerPlayer: {
    [Owner.ONE]: Record<ProteinType, number>
    [Owner.TWO]: Record<ProteinType, number>
  } = {
    [Owner.ONE]: { A: 0, B: 0, C: 0, D: 0 },
    [Owner.TWO]: { A: 0, B: 0, C: 0, D: 0 },
  }

  public requiredActionsCount = 0

  public nextOrganId = 0

  public grid: Entity[] = []

  public entities: Entity[] = []

  public proteins: Entity[] = []

  public isSparseProtein = false

  public setMapSize(input: string) {
    const [width, height] = input.split(' ').map(Number)
    this.width = width
    this.height = height
  }

  public isProtein(type: EntityType): boolean {
    return [EntityType.A, EntityType.B, EntityType.C, EntityType.D].includes(type)
  }

  public getGridIndex({ x, y }: SimplePoint): number {
    return y * this.width + x
  }

  public getEntityAt(point: SimplePoint): Entity {
    const entity = this.grid[this.getGridIndex(point)]

    if (entity) {
      return entity
    }
    return new Entity(point.x, point.y, EntityType.EMPTY, Owner.NONE, 0, Direction.X, 0, 0)
  }

  public checkIfMapIsSparseProtein() {
    const cProteinCount = this.entities.filter((e) => e.type === EntityType.C).length
    const dProteinCount = this.entities.filter((e) => e.type === EntityType.D).length
    const bProteinCount = this.entities.filter((e) => e.type === EntityType.B).length

    if (cProteinCount <= 4 || dProteinCount <= 4 || bProteinCount <= 4) {
      this.isSparseProtein = true
    } else {
      this.isSparseProtein = false
    }
  }

  public refreshState(inputs: string[]) {
    this.turn++

    this.entities = []

    this.grid = new Array<Entity>(this.height * this.width).fill(
      new Entity(0, 0, EntityType.EMPTY, Owner.NONE, 0, Direction.X, 0, 0),
    )

    const entityCount = parseInt(inputs.shift()!)

    for (let i = 0; i < entityCount; i++) {
      const [xStr, yStr, type, owner, organId, organDir, organParentId, organRootId] = inputs
        .shift()!
        .split(' ')
      const entityType = StringToEntityType[type as keyof typeof StringToEntityType]
      const x = parseInt(xStr)
      const y = parseInt(yStr)
      const entity = new Entity(
        x,
        y,
        entityType,
        parseInt(owner),
        parseInt(organId),
        organDir as Direction,
        parseInt(organParentId),
        parseInt(organRootId),
      )
      this.entities.push(entity)
      this.grid[this.getGridIndex({ x, y })] = entity
    }

    this.nextOrganId = this.entities.reduce((acc, entity) => Math.max(acc, entity.organId), 0) + 1

    const [myA, myB, myC, myD] = inputs.shift()!.split(' ').map(Number)
    this.proteinsPerPlayer[Owner.ONE] = { A: myA, B: myB, C: myC, D: myD }

    const [oppA, oppB, oppC, oppD] = inputs.shift()!.split(' ').map(Number)
    this.proteinsPerPlayer[Owner.TWO] = { A: oppA, B: oppB, C: oppC, D: oppD }

    this.requiredActionsCount = parseInt(inputs.shift()!)

    this.refreshProteins()

    this.checkIfMapIsSparseProtein()
  }

  public canGrowHere(point: SimplePoint): boolean {
    return [
      { x: point.x - 1, y: point.y },
      { x: point.x + 1, y: point.y },
      { x: point.x, y: point.y - 1 },
      { x: point.x, y: point.y + 1 },
    ].every(
      (n) =>
        !this.entities.some(
          (t) =>
            t.type === EntityType.TENTACLE &&
            t.x === n.x &&
            t.y === n.y &&
            getDirection(t, point) === t.organDir,
        ),
    )
  }

  public isAlreadyDefended(point: SimplePoint, owner = Owner.ONE): boolean {
    return this.getNeighboursButWall(point).some((p) => {
      const t = this.getEntityAt(p)
      return (
        t.owner === owner &&
        t.type === EntityType.TENTACLE &&
        // t.x === point.x &&
        // t.y === point.y &&
        getDirection(t, point) === t.organDir
      )
    })
  }

  public getNeighboursButWall(point: SimplePoint): SimplePoint[] {
    return [
      { x: point.x - 1, y: point.y },
      { x: point.x + 1, y: point.y },
      { x: point.x, y: point.y - 1 },
      { x: point.x, y: point.y + 1 },
    ].filter(
      ({ x, y }) =>
        x >= 0 &&
        x < this.width &&
        y >= 0 &&
        y < this.height &&
        this.getEntityAt({ x, y }).type !== EntityType.WALL,
    )
  }

  public getNeighboursOfTypes(point: SimplePoint, types: EntityType[]): SimplePoint[] {
    const neighbours = [
      { x: point.x - 1, y: point.y },
      { x: point.x + 1, y: point.y },
      { x: point.x, y: point.y - 1 },
      { x: point.x, y: point.y + 1 },
    ].filter(
      ({ x, y }) =>
        x >= 0 &&
        x < this.width &&
        y >= 0 &&
        y < this.height &&
        types.includes(this.getEntityAt({ x, y }).type),
    )
    return neighbours
  }

  public getNeighbours(point: SimplePoint): SimplePoint[] {
    const neighbours = [
      { x: point.x - 1, y: point.y },
      { x: point.x + 1, y: point.y },
      { x: point.x, y: point.y - 1 },
      { x: point.x, y: point.y + 1 },
    ].filter(
      ({ x, y }) =>
        x >= 0 &&
        x < this.width &&
        y >= 0 &&
        y < this.height &&
        [EntityType.EMPTY, EntityType.A, EntityType.B, EntityType.C, EntityType.D].includes(
          this.getEntityAt({ x, y }).type,
        ),
    )
    return neighbours
  }

  public applyAction(action: GrowAction | SporeAction | WaitAction) {
    if (action instanceof WaitAction) {
      return
    }

    const { direction, type, target, organId, playerId } = action

    const parent = this.entities.find((o) => o.organId === organId)
    if (!parent) {
      throw new Error(`Cannot find parent organ with id ${organId}`)
    }

    const newEntity = new Entity(
      target.x,
      target.y,
      type,
      playerId,
      this.nextOrganId, // Assuming the new entity has the next id
      direction,
      parent.organId,
      parent.type === EntityType.ROOT ? parent.organId : parent.organRootId,
    )
    this.nextOrganId += 1
    const entityAtTarget = this.getEntityAt(target)
    if (entityAtTarget.owner !== Owner.NONE) {
      throw new Error(`Cannot grow on top of an existing entity at ${target.x}, ${target.y}`)
    }

    this.entities = this.entities.filter((e) => e.x !== target.x || e.y !== target.y)
    this.entities.push(newEntity)
    this.grid[target.x + target.y * this.width] = newEntity
    const proteinsNeeded = ProteinsPerOrgan[type as OrganType]
    for (const protein of Object.keys(proteinsNeeded)) {
      this.proteinsPerPlayer[playerId][protein as keyof typeof proteinsNeeded] -=
        proteinsNeeded[protein as keyof typeof proteinsNeeded]
    }
    if (type === EntityType.HARVESTER) {
      const [nx, ny] = DirectionToDxDy[direction]
      const harvestEntity = this.getEntityAt({ x: target.x + nx, y: target.y + ny })
      if (harvestEntity.isProtein) {
        harvestEntity.isAlreadyHarvested = true
        this.proteinGainsPerPlayer[playerId][type as ProteinType] += 1
      }
    }
  }

  public updateStateFromActions() {
    this.refreshProteins()
  }

  public refreshProteins() {
    for (const protein of this.proteins) {
      protein.isAlreadyHarvested = false
    }

    for (const type of ProteinTypes) {
      this.proteinGainsPerPlayer[0][type as ProteinType] = 0
      this.proteinGainsPerPlayer[1][type as ProteinType] = 0
    }
    this.proteins = this.entities.filter((entity) =>
      [EntityType.A, EntityType.B, EntityType.C, EntityType.D].includes(entity.type),
    )

    const harvesters = this.entities.filter((organ) => organ.type === EntityType.HARVESTER)

    harvesters.forEach((harvester) => {
      const neighbours = this.getNeighbours(harvester)
      neighbours.forEach((n) => {
        const entity = this.getEntityAt(n)
        if (!entity.isProtein || entity.isAlreadyHarvested) return
        const direction = getDirection(harvester, n)
        if (direction !== harvester.organDir) return

        const { type } = entity
        entity.isAlreadyHarvested = true
        const playerId = harvester.owner as Owner.ONE | Owner.TWO

        this.proteinGainsPerPlayer[playerId][type as ProteinType]++
        this.proteinsPerPlayer[playerId][type as ProteinType]++
      })
    })

    // this.debug("Proteins gains", this.myProteinsGains);
  }
}
