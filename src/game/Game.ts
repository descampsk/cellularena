import { v4 } from 'uuid'
import { Owner } from './Entity'
import type { FirestoreDataConverter, QueryDocumentSnapshot } from 'firebase/firestore'
import { getRandomSeed } from './maps'

export type GameMode = 'training' | 'versus' | 'solo'

export class Game {
  public id = v4()

  public seed: string

  public mode: GameMode = 'versus'

  public serializedState: string = ''

  public playerIds: Record<string, Owner.ONE | Owner.TWO> = {
    [v4()]: Owner.ONE,
    [v4()]: Owner.TWO,
  }

  public connectedPlayers: {
    [Owner.ONE]: boolean
    [Owner.TWO]: boolean
  } = {
    0: false,
    1: false,
  }

  public waitingForActions: {
    [Owner.ONE]: boolean
    [Owner.TWO]: boolean
  } = {
    0: true,
    1: true,
  }

  public turn = 1

  public winner: Owner | null = null

  public createdAt = new Date()

  constructor(game: Partial<Game>) {
    this.seed = getRandomSeed()
    const { connectedPlayers, playerIds, seed, turn, waitingForActions, id, mode, winner } = game
    if (id) this.id = id
    if (connectedPlayers) this.connectedPlayers = connectedPlayers
    if (playerIds) this.playerIds = playerIds
    if (seed) this.seed = seed
    if (turn) this.turn = turn
    if (waitingForActions) this.waitingForActions = waitingForActions
    if (mode) this.mode = mode
    if (winner) this.winner = winner
  }
}

export const gameFirestoreConvertor: FirestoreDataConverter<Game> = {
  toFirestore: (game: Game) => {
    return {
      ...game,
    }
  },

  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data()

    return new Game(data)
  },
}
