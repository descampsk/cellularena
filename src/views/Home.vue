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
import { v4 as uuidv4 } from 'uuid'

export default {
  name: 'HomeView',
  data() {
    return { gameId: '' }
  },
  methods: {
    async createGame() {
      const gameId = uuidv4()
      // await set(ref(this.$firebase.database, `games/${gameId}`), {
      //   players: { player1: null, player2: null },
      //   state: {},
      // })
      this.$router.push(`/game/${gameId}`)
    },
    joinGame() {
      if (this.gameId) {
        this.$router.push(`/game/${this.gameId}`)
      }
    },
  },
}
</script>
