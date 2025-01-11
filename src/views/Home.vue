<template>
  <div>
    <h1>Multiplayer Game</h1>
    <button @click="createGame">Create Game</button>
    <input v-model="gameId" placeholder="Enter Game ID" />
    <button @click="joinGame">Join Game</button>
  </div>
</template>

<script lang="ts">
// import { ref, set } from '../../firebase'
import { doc, setDoc } from 'firebase/firestore'
import { v4 as uuidv4 } from 'uuid'
import { useFirestore } from 'vuefire'
import { Game, gameFirestoreConvertor } from '@/game/Game'
import { Owner } from '@/game/Entity'

export default {
  name: 'HomeView',
  data() {
    return { gameId: '' }
  },
  methods: {
    async createGame() {
      const db = useFirestore()
      const playerOneUuid = uuidv4()
      const playerTwoUuid = uuidv4()
      const game = new Game({
        seed: '-109498249532328380',
        playerIds: {
          [playerOneUuid]: Owner.ONE,
          [playerTwoUuid]: Owner.TWO,
        },
      })
      const gameDoc = doc(db, 'games', game.id).withConverter(gameFirestoreConvertor)
      setDoc(gameDoc, game)
      this.$router.push(`/game/${game.id}/player/${playerOneUuid}`)
    },
    joinGame() {
      if (this.gameId) {
        this.$router.push(`/game/${this.gameId}`)
      }
    },
  },
}
</script>
