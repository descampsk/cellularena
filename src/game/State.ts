import { type Action } from './Actions'
import { getDirection } from './helpers'
import { Direction, Entity, EntityType, Owner, ProteinTypes } from './Entity'
import { type SimplePoint } from './Point'

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

  public myProteins: Record<ProteinType, number> = { A: 0, B: 0, C: 0, D: 0 }

  public oppProteins = { A: 0, B: 0, C: 0, D: 0 }

  public requiredActionsCount = 0

  public nextOrganId = 0

  public grid: Entity[] = []

  public entities: Entity[] = []

  public proteins: Entity[] = []

  public isSparseProtein = false

  public myProteinsGains: Record<ProteinType, number> = {
    A: 0,
    B: 0,
    C: 0,
    D: 0,
  }

  public oppProteinsGains: Record<ProteinType, number> = {
    A: 0,
    B: 0,
    C: 0,
    D: 0,
  }

  public myOrgans: Entity[] = []

  public enemyOrgans: Entity[] = []

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
    this.myProteins = { A: myA, B: myB, C: myC, D: myD }

    const [oppA, oppB, oppC, oppD] = inputs.shift()!.split(' ').map(Number)
    this.oppProteins = { A: oppA, B: oppB, C: oppC, D: oppD }

    this.requiredActionsCount = parseInt(inputs.shift()!)

    this.myOrgans = this.entities.filter((entity) => entity.owner === Owner.ME)

    this.enemyOrgans = this.entities.filter((entity) => entity.owner === Owner.OPPONENT)

    this.refreshProteins()

    this.tagProteins()

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
        !this.enemyOrgans.some(
          (t) =>
            t.type === EntityType.TENTACLE &&
            t.x === n.x &&
            t.y === n.y &&
            getDirection(t, point) === t.organDir,
        ),
    )
  }

  public isAlreadyDefended(point: SimplePoint, owner = Owner.ME): boolean {
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

  public canEnnemyGrowHere(point: SimplePoint): boolean {
    const points = [
      { x: point.x - 1, y: point.y },
      { x: point.x + 1, y: point.y },
      { x: point.x, y: point.y - 1 },
      { x: point.x, y: point.y + 1 },
    ]
    return (
      points.every(
        (n) =>
          !this.myOrgans.some(
            (t) =>
              t.type === EntityType.TENTACLE &&
              t.x === n.x &&
              t.y === n.y &&
              getDirection(t, point) === t.organDir,
          ),
      ) && points.some((n) => this.enemyOrgans.some((t) => t.x === n.x && t.y === n.y))
    )
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

  public tagProteins() {
    this.proteins.forEach((p) => {
      // Reset tags
      p.shouldBeJumped = false

      // Get non-wall neighbors
      const neighbors = this.getNeighboursButWall(p)

      // Skip proteins that are easily accessible (have alternative paths)
      if (neighbors.length === 2) {
        // Check if neighbors are in straight line
        if (neighbors[0].x === neighbors[1].x || neighbors[0].y === neighbors[1].y) {
          p.shouldBeJumped = true
        }
      }
    })
  }

  public updateStateFromActions() {
    this.refreshProteins(true)
  }

  public refreshProteins(isVisualizer = false) {
    for (const protein of this.proteins) {
      protein.isAlreadyHarvested = false
    }

    for (const key of Object.keys(this.myProteinsGains)) {
      this.myProteinsGains[key as ProteinType] = 0
    }
    for (const key of Object.keys(this.oppProteinsGains)) {
      this.oppProteinsGains[key as ProteinType] = 0
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
        const protein = EntityTypeToString[type] as keyof typeof this.myProteins

        if (harvester.owner === Owner.ME) {
          entity.isAlreadyHarvested = true
          this.myProteinsGains[protein]++
          if (isVisualizer) {
            this.myProteins[protein]++
          }
        } else {
          this.oppProteinsGains[protein]++
        }
      })
    })

    // this.debug("Proteins gains", this.myProteinsGains);
  }

  public checkIfActionWillBlockHarvest(
    position: SimplePoint,
    target: SimplePoint,
    type: EntityType,
  ) {
    const { myProteins, myProteinsGains } = this
    const entity = this.getEntityAt(position)
    const positionEntity = entity.type

    if (myProteins.C <= 2 && myProteinsGains.C < 1 && positionEntity === EntityType.C) {
      return true
    }

    if (myProteins.D <= 2 && myProteinsGains.D < 1 && positionEntity === EntityType.D) {
      return true
    }

    if (
      type === EntityType.SPORER &&
      myProteins.D <= 2 &&
      (myProteinsGains.D < 1 || (myProteinsGains.D === 1 && positionEntity === EntityType.D))
    ) {
      return true
    }

    if (
      type === EntityType.TENTACLE &&
      myProteins.C <= 2 &&
      (myProteinsGains.C < 1 || (myProteinsGains.C === 1 && positionEntity === EntityType.C))
    ) {
      return true
    }

    if (type === EntityType.HARVESTER) {
      const harvestTarget = this.getEntityAt(target).type
      if (myProteins.C <= 1 && myProteinsGains.C < 1 && harvestTarget !== EntityType.C) {
        return true
      }
      if (myProteins.D <= 1 && myProteinsGains.D < 1 && harvestTarget !== EntityType.D) {
        return true
      }

      if (
        (myProteins.D <= 2 || myProteins.C <= 2) &&
        myProteinsGains.C < 1 &&
        myProteinsGains.D < 1 &&
        harvestTarget !== EntityType.C &&
        harvestTarget !== EntityType.D
      ) {
        return true
      }
    }
    return false
  }

  clone() {
    const cloneState = new State()
    cloneState.turn = this.turn
    cloneState.width = this.width
    cloneState.height = this.height
    cloneState.myProteins = { ...this.myProteins }
    cloneState.oppProteins = { ...this.oppProteins }
    cloneState.myProteinsGains = { ...this.myProteinsGains }
    cloneState.requiredActionsCount = this.requiredActionsCount
    cloneState.nextOrganId = this.nextOrganId
    cloneState.grid = new Array<Entity>(this.grid.length)
    cloneState.entities = new Array<Entity>(this.entities.length)

    this.entities.forEach((e, index) => {
      const clone = ProteinTypes.includes(e.type) ? Entity.clone(e) : e
      cloneState.entities[index] = clone
      cloneState.grid[e.x + cloneState.width * e.y] = clone
      if (clone.isProtein) {
        cloneState.proteins.push(clone)
      } else if (clone.owner === Owner.ME) {
        cloneState.myOrgans.push(clone)
      }
    })

    return cloneState
  }
}

export const state = new State()
