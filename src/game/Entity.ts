import { type SimplePoint } from './Point'

export enum EntityType {
  EMPTY = 0,
  WALL = 1,
  ROOT = 2,
  BASIC = 3,
  HARVESTER = 4,
  TENTACLE = 5,
  SPORER = 6,
  A = 7,
  B = 8,
  C = 9,
  D = 10,
}

export const ProteinTypes = [EntityType.A, EntityType.B, EntityType.C, EntityType.D]

export enum Owner {
  ME = 1,
  OPPONENT = 0,
  NONE = -1,
}

export enum Direction {
  N = 'N',
  E = 'E',
  S = 'S',
  W = 'W',
  X = 'X',
}

export const getDxDyFromDirection = (direction: Direction): [number, number] => {
  switch (direction) {
    case Direction.N:
      return [0, -1]
    case Direction.E:
      return [1, 0]
    case Direction.S:
      return [0, 1]
    case Direction.W:
      return [-1, 0]
    default:
      return [0, 0]
  }
}

export class Entity implements SimplePoint {
  public isProtein = false

  public isAlreadyHarvested = false

  public shouldBeJumped = false

  public isTemporary = false

  // public isHarvestable = true;

  constructor(
    public x: number,
    public y: number,
    public type: EntityType,
    public owner: Owner,
    public organId: number,
    public organDir: Direction,
    public organParentId: number,
    public organRootId: number,
  ) {
    this.isProtein = ProteinTypes.includes(this.type)
  }

  static clone(entity: Entity): Entity {
    return { ...entity } as Entity
  }
}
