import { EntityType, Owner } from './Entity'
import type { SimplePoint } from './Point'
import type { State } from './State'

export class EndGameChecker {
  constructor(private state: State) {}

  public checkWinner(): { winner: Owner | null; reason: string | null } {
    const playerDestroyed = this.checkPlayerDestroyed()
    if (playerDestroyed !== null) {
      return { winner: playerDestroyed, reason: 'Killed the opponent' }
    }

    const afterTurn50 = this.checkAfterTurn50()
    if (afterTurn50 !== null) {
      return { winner: afterTurn50, reason: 'More cells after 50 turns' }
    }

    const hasOnePlayerSecureMoreThanHalf = this.checkIfOnePlayerHasSecureMoreThanHalf()
    if (hasOnePlayerSecureMoreThanHalf !== null) {
      return { winner: hasOnePlayerSecureMoreThanHalf, reason: 'Secured more than half of the map' }
    }

    const onePlayerCanMoveAndTheOtherCant = this.checkIfOnePlayerCanMoveAndTheOtherCant()
    if (onePlayerCanMoveAndTheOtherCant !== null) {
      return { winner: onePlayerCanMoveAndTheOtherCant, reason: 'Immbolized opponent' }
    }

    return { winner: null, reason: null }
  }

  public checkPlayerDestroyed(): Owner | null {
    const scorePerPlayer = this.getScorePerPlayer()
    for (const player of [Owner.ONE, Owner.TWO]) {
      if (scorePerPlayer[player] === 0) {
        return player === Owner.ONE ? Owner.TWO : Owner.ONE
      }
    }

    return null
  }

  public checkAfterTurn50(): Owner | null {
    if (this.state.turn < 50) return null

    const scorePerPlayer = this.getScorePerPlayer()

    if (scorePerPlayer[Owner.ONE] > scorePerPlayer[Owner.TWO]) {
      return Owner.ONE
    }

    if (scorePerPlayer[Owner.ONE] < scorePerPlayer[Owner.TWO]) {
      return Owner.TWO
    }

    const totalProteinsPlayerOne = Object.values(this.state.proteinsPerPlayer[Owner.ONE]).reduce(
      (acc, value) => acc + value,
      0,
    )
    const totalProteinsPlayerTwo = Object.values(this.state.proteinsPerPlayer[Owner.TWO]).reduce(
      (acc, value) => acc + value,
      0,
    )

    if (totalProteinsPlayerOne > totalProteinsPlayerTwo) {
      return Owner.ONE
    }

    if (totalProteinsPlayerOne < totalProteinsPlayerTwo) {
      return Owner.TWO
    }
    return Owner.NONE
  }

  public canPlayerMoveUndefinetly(player: Owner.ONE | Owner.TWO): boolean {
    const gainsPlayer = this.state.proteinGainsPerPlayer[player]

    return (
      gainsPlayer.A > 0 ||
      (gainsPlayer.B > 0 && gainsPlayer.C > 0) ||
      (gainsPlayer.B > 0 && gainsPlayer.D > 0) ||
      (gainsPlayer.C > 0 && gainsPlayer.D > 0)
    )
  }

  public canGrowAnyOrgan(player: Owner.ONE | Owner.TWO): boolean {
    const proteins = this.state.proteinsPerPlayer[player]
    return (
      proteins.A > 0 ||
      (proteins.B > 0 && proteins.C > 0) ||
      (proteins.B > 0 && proteins.D > 0) ||
      (proteins.C > 0 && proteins.D > 0)
    )
  }

  public checkIfOnePlayerCanMoveAndTheOtherCant(): Owner | null {
    const playerOneCanMove =
      this.canPlayerMoveUndefinetly(Owner.ONE) || this.canGrowAnyOrgan(Owner.ONE)
    const playerTwoCanMove =
      this.canPlayerMoveUndefinetly(Owner.TWO) || this.canGrowAnyOrgan(Owner.TWO)

    if (playerOneCanMove && !playerTwoCanMove) {
      return Owner.ONE
    }

    if (playerTwoCanMove && !playerOneCanMove) {
      return Owner.TWO
    }

    return null
  }

  public checkIfOnePlayerHasSecureMoreThanHalf(): Owner | null {
    const secureScorePlayerOne = this.computeSecureScore(Owner.ONE)
    const secureScorePlayerTwo = this.computeSecureScore(Owner.TWO)
    const totalCell = this.getTotalCells()
    console.log('Secure score', secureScorePlayerOne, secureScorePlayerTwo, totalCell)

    if (
      secureScorePlayerOne > totalCell / 2 &&
      secureScorePlayerOne > secureScorePlayerTwo &&
      this.canPlayerMoveUndefinetly(Owner.ONE) &&
      this.canGrowAnyOrgan(Owner.ONE)
    ) {
      return Owner.ONE
    }

    if (
      secureScorePlayerTwo > totalCell / 2 &&
      secureScorePlayerTwo > secureScorePlayerOne &&
      this.canPlayerMoveUndefinetly(Owner.TWO) &&
      this.canGrowAnyOrgan(Owner.TWO)
    ) {
      return Owner.TWO
    }

    if (
      secureScorePlayerOne > totalCell / 2 &&
      secureScorePlayerTwo > totalCell / 2 &&
      secureScorePlayerOne === secureScorePlayerTwo &&
      this.canPlayerMoveUndefinetly(Owner.ONE) &&
      this.canGrowAnyOrgan(Owner.ONE) &&
      this.canPlayerMoveUndefinetly(Owner.TWO) &&
      this.canGrowAnyOrgan(Owner.TWO)
    ) {
      return Owner.NONE
    }

    return null
  }

  getScorePerPlayer(): Record<Owner, number> {
    return this.state.entities.reduce(
      (acc, entity) => {
        if (entity.owner === Owner.NONE) {
          return acc
        }

        return {
          ...acc,
          [entity.owner]: acc[entity.owner] + 1,
        }
      },
      {
        [Owner.ONE]: 0,
        [Owner.TWO]: 0,
      } as Record<Owner, number>,
    )
  }

  public getTotalCells(): number {
    return this.state.grid.reduce((acc, cell) => acc + (cell.type !== EntityType.WALL ? 1 : 0), 0)
  }

  public computeSecureScore(owner: Owner): number {
    const queue = new Array<SimplePoint>()
    const visited = new Set<string>()

    const opponent = owner === Owner.ONE ? Owner.TWO : Owner.ONE

    const entities = this.state.entities.filter((e) => e.owner === opponent)

    const getNextNodes = (current: SimplePoint): SimplePoint[] => {
      const nextNodes: SimplePoint[] = []

      for (const nextPoint of this.state.getNeighboursButWall(current)) {
        const entity = this.state.getEntityAt(nextPoint)

        if (entity.owner !== opponent && !this.state.isAlreadyDefended(nextPoint, owner)) {
          nextNodes.push(nextPoint)
        }
      }

      return nextNodes
    }

    const getKey = (point: SimplePoint) => `${point.x},${point.y}`

    // Initialize with start nodes
    for (const startNode of entities.map((e) => ({
      x: e.x,
      y: e.y,
    }))) {
      queue.push(startNode)
    }

    while (queue.length > 0) {
      const current = queue.pop()!

      const key = getKey(current)
      if (visited.has(key)) continue
      visited.add(key)

      // Get and process next possible nodes
      queue.push(...getNextNodes(current))
    }

    return this.getTotalCells() - visited.size
  }
}
