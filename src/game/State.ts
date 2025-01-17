import { getDirection } from './helpers'
import { Direction, Entity, EntityType, getDxDyFromDirection, Owner, ProteinTypes } from './Entity'
import { type SimplePoint } from './Point'
import { GrowAction, WaitAction, type SporeAction } from './Actions'

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
  public turn = 1

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

  public refreshState(inputs: string[]) {
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
  }

  public checkYSymmetry(): boolean {
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        const entity = this.getEntityAt({ x, y })
        const entitySym = this.getEntityAt({ x: this.width - x - 1, y: this.height - y - 1 })
        if (entity.type !== entitySym.type) {
          console.debug('Not symmetrical at', x, y)
          return false
        }
      }
    }

    console.debug('The map is Y-symmetrical')
    return true
  }

  public canGrowHere(point: SimplePoint, owner: Owner): boolean {
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
            t.owner !== owner &&
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

    if (action instanceof GrowAction && type === EntityType.ROOT) {
      throw new Error('Root can only be grown with SporeAction')
    }

    const proteinCost = ProteinsPerOrgan[type as OrganType]
    const playerProteins = this.proteinsPerPlayer[playerId]
    const hasEnoughProteins = (Object.keys(proteinCost) as ProteinType[]).every(
      (protein) => playerProteins[protein] >= proteinCost[protein],
    )
    if (!hasEnoughProteins) {
      throw new Error(`Player ${playerId} does not have enough proteins to grow a ${type}`)
    }

    const parent = this.entities.find((o) => o.organId === organId)
    if (!parent) {
      throw new Error(`Cannot find parent organ with id ${organId}`)
    }

    const organRootId = parent.type === EntityType.ROOT ? parent.organId : parent.organRootId

    const newEntity = new Entity(
      target.x,
      target.y,
      type,
      playerId,
      this.nextOrganId, // Assuming the new entity has the next id
      direction,
      type === EntityType.ROOT ? 0 : parent.organId,
      type === EntityType.ROOT ? 0 : organRootId,
    )
    const entityAtTarget = this.getEntityAt(target)
    if (entityAtTarget.owner !== Owner.NONE && !entityAtTarget.oldEntity) {
      throw new Error(`Cannot grow on top of an existing entity at ${target.x}, ${target.y}`)
    }

    this.nextOrganId += 1

    newEntity.oldEntity = entityAtTarget
    this.entities = this.entities.filter((e) => e.x !== target.x || e.y !== target.y)
    this.entities.push(newEntity)
    this.grid[target.x + target.y * this.width] = newEntity
    const proteinsNeeded = ProteinsPerOrgan[type as OrganType]
    for (const protein of Object.keys(proteinsNeeded)) {
      this.proteinsPerPlayer[playerId][protein as keyof typeof proteinsNeeded] -=
        proteinsNeeded[protein as keyof typeof proteinsNeeded]
    }
  }

  public doTentacleAttacks() {
    const tentacles = this.entities.filter((entity) => entity.type === EntityType.TENTACLE)
    const entitiesToDestroy: Entity[] = []
    tentacles.forEach((tentacle) => {
      const [dx, dy] = DirectionToDxDy[tentacle.organDir]
      const target = this.getEntityAt({ x: tentacle.x + dx, y: tentacle.y + dy })
      if (target.owner == Owner.NONE || target.owner == tentacle.owner) {
        return
      }
      entitiesToDestroy.push(target)
      const stack = [target]
      const ownerEntities = this.entities.filter((o) => o.owner === target.owner)
      while (stack.length > 0) {
        const current = stack.pop()!
        const newChildrens = ownerEntities.filter((o) => o.organParentId === current.organId)
        entitiesToDestroy.push(...newChildrens)
        stack.push(...newChildrens)
      }
    })

    this.entities = this.entities.filter((e) => !entitiesToDestroy.includes(e))

    console.log('entitiesToDestroy', entitiesToDestroy)

    entitiesToDestroy.forEach((entity) => {
      this.grid[entity.x + entity.y * this.width] = new Entity(
        entity.x,
        entity.y,
        EntityType.EMPTY,
        Owner.NONE,
        0,
        Direction.X,
        0,
        0,
      )
    })
  }

  public refreshAfterActions() {
    this.refreshProteins()
    this.doWallCollisions()
    this.retrieveProteinsBonus()
    this.doTentacleAttacks()
  }

  public retrieveProteinsBonus() {
    this.entities.forEach((entity) => {
      const oldEntity = entity.oldEntity
      if (!oldEntity) return

      if (!ProteinTypes.includes(oldEntity.type)) {
        entity.oldEntity = null
        return
      }

      entity.oldEntity = null
      const playerId = entity.owner as Owner.ONE | Owner.TWO
      this.proteinsPerPlayer[playerId][oldEntity.type as ProteinType] += 3
    })
  }

  public doWallCollisions() {
    const entitiesToBecomeWall = this.entities.filter((entity) => {
      const oldEntity = entity.oldEntity
      if (!oldEntity) return false

      if ([EntityType.EMPTY].includes(oldEntity.type)) {
        entity.oldEntity = null
        return false
      }

      if (ProteinTypes.includes(oldEntity.type)) {
        return false
      }

      entity.oldEntity = null
      return true
    })

    console.log('entitiesToBecomeWall', entitiesToBecomeWall)

    entitiesToBecomeWall.forEach((entity) => {
      entity.type = EntityType.WALL
      entity.owner = Owner.NONE
      entity.organId = 0
      entity.organDir = Direction.X
      entity.organParentId = 0
    })
  }

  public refreshProteins() {
    for (const protein of this.proteins) {
      protein.harvestedBy.clear()
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
        const playerId = harvester.owner as Owner.ONE | Owner.TWO

        if (!entity.isProtein || entity.harvestedBy.has(playerId)) return
        const direction = getDirection(harvester, n)
        if (direction !== harvester.organDir) return

        const { type } = entity
        entity.harvestedBy.add(playerId)

        this.proteinGainsPerPlayer[playerId][type as ProteinType]++
        this.proteinsPerPlayer[playerId][type as ProteinType]++
      })
    })
  }

  createInputsForAI(playerId: Owner.ONE | Owner.TWO): string[] {
    const otherPlayerId = playerId === Owner.ONE ? Owner.TWO : Owner.ONE
    const inputs = []
    inputs.push(`${this.width} ${this.height}`)
    inputs.push(`${this.entities.length}`)
    this.entities.forEach((entity) => {
      inputs.push(
        `${entity.x} ${entity.y} ${entity.type} ${entity.owner} ${entity.organId} ${entity.organDir} ${entity.organParentId} ${entity.organRootId}`,
      )
    })
    inputs.push(
      `${this.proteinsPerPlayer[playerId].A} ${this.proteinsPerPlayer[playerId].B} ${this.proteinsPerPlayer[playerId].C} ${this.proteinsPerPlayer[playerId].D}`,
    )
    inputs.push(
      `${this.proteinsPerPlayer[otherPlayerId].A} ${this.proteinsPerPlayer[otherPlayerId].B} ${this.proteinsPerPlayer[otherPlayerId].C} ${this.proteinsPerPlayer[otherPlayerId].D}`,
    )
    inputs.push(
      `${this.entities.filter((e) => e.type === EntityType.ROOT && e.owner === playerId).length}`,
    )

    return inputs
  }

  getGrowableCells(root: Entity, playerId: Owner): Array<{ x: number; y: number }> {
    const cells: Array<{ x: number; y: number }> = []

    const organs = this.entities.filter(
      (e) => e.owner === playerId && (e.organId === root.organId || e.organRootId === root.organId),
    )

    const directions = [
      { dx: 0, dy: -1 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
    ]

    organs.forEach((organ) => {
      const { x, y } = organ
      directions.forEach(({ dx, dy }) => {
        const nx = x + dx
        const ny = y + dy

        if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
          const entity = this.getEntityAt({ x: nx, y: ny })
          if (
            [EntityType.EMPTY, ...ProteinTypes].includes(entity.type) &&
            this.canGrowHere({ x: nx, y: ny }, playerId)
          ) {
            cells.push({ x: nx, y: ny })
          }
        }
      })
    })

    const sporers = organs.filter((o) => o.type === EntityType.SPORER)
    sporers.forEach((sporer) => {
      const { x, y } = sporer
      const [dx, dy] = getDxDyFromDirection(sporer.organDir)
      let nx = x + dx
      let ny = y + dy
      while (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
        const entity = this.getEntityAt({ x: nx, y: ny })
        if ([EntityType.EMPTY, ...ProteinTypes].includes(entity.type)) {
          if (this.canGrowHere({ x: nx, y: ny }, playerId)) {
            cells.push({ x: nx, y: ny })
          }
          nx += dx
          ny += dy
          continue
        }
        break
      }
    })

    return cells.filter((c, idx) => cells.findIndex((c1) => c1.x === c.x && c1.y === c.y) === idx)
  }
}
