import { Owner } from './Entity'
import type { State } from './State'

export class EndGameChecker {
  constructor(private state: State) {}

  public checkWinner(): Owner | null {
    const { turn } = this.state

    const scorePerPlayer = this.getScorePerPlayer()

    for (const player of [Owner.ONE, Owner.TWO]) {
      if (scorePerPlayer[player] === 0) {
        return player === Owner.ONE ? Owner.TWO : Owner.ONE
      }
    }

    if (turn >= 50) {
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
}
