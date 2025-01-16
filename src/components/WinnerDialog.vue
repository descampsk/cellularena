<template>
  <div v-if="show" class="dialog-backdrop" @click.self="$emit('close')">
    <div class="dialog-content">
      <img src="@/assets/cellularena.png" alt="Cellularena" class="logo" />

      <div class="winner-announcement" :class="winnerClass">
        {{ winnerAnnouncement }}
      </div>

      <div class="scores">
        <div class="score-line">
          <span class="player blue">Blue Player</span>
          <span class="points blue">{{ scorePerPlayer[0] }} points</span>
        </div>
        <div class="score-line">
          <span class="player red">Red Player</span>
          <span class="points red">{{ scorePerPlayer[1] }} points</span>
        </div>
      </div>

      <div class="actions">
        <button class="action-button" @click="playAgain">Play Again</button>
        <button class="action-button" @click="watchReplay">Watch Replay</button>
        <button class="action-button" @click="goToMenu">Menu</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import router from '@/router'
import { doc, getFirestore, setDoc } from 'firebase/firestore'
import { Game, gameFirestoreConvertor } from '@/game/Game'
import { Owner } from '@/game/Entity'

export default defineComponent({
  name: 'WinnerDialog',
  props: {
    show: {
      type: Boolean,
      required: true,
    },
    scorePerPlayer: {
      type: Object as PropType<Record<Owner.ONE | Owner.TWO, number>>,
      required: true,
    },
    winner: {
      type: Number as PropType<Owner>,
      required: true,
    },
    game: {
      type: Game,
      required: true,
    },
    playerId: {
      type: Number as PropType<Owner.ONE | Owner.TWO>,
      required: true,
    },
  },
  computed: {
    winnerAnnouncement(): string {
      if (this.winner === Owner.ONE) return 'Blue Player Won!'
      if (this.winner === Owner.TWO) return 'Red Player Won!'
      return 'Draw!'
    },
    winnerClass(): string {
      if (this.winner === Owner.ONE) return 'blue'
      if (this.winner === Owner.TWO) return 'red'
      return 'draw'
    },
  },
  methods: {
    async playAgain() {
      const db = getFirestore()
      const newGame = new Game({
        mode: this.game.mode,
        playerIds: { ...this.game.playerIds },
      })

      const gameDoc = doc(db, 'games', newGame.id).withConverter(gameFirestoreConvertor)
      await setDoc(gameDoc, newGame)

      const playerUuid = Object.entries(this.game.playerIds).find(
        ([, id]) => id === this.playerId,
      )?.[0]
      router.push(`/game/${newGame.id}/player/${playerUuid}`)
    },
    watchReplay() {
      const playerUuid = Object.entries(this.game.playerIds).find(
        ([, id]) => id !== this.playerId,
      )?.[0]
      router.push(`/replay/${this.game.id}/player/${playerUuid}`)
    },
    goToMenu() {
      router.push('/')
    },
  },
})
</script>

<style scoped>
.dialog-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.dialog-content {
  background: rgba(255, 255, 255, 0);
  padding: 2rem;
  border-radius: 8px;
  text-align: center;
  max-width: 500px;
  width: 90%;
}

.logo {
  max-width: 300px;
  margin-bottom: 2rem;
}

.scores {
  margin: 2rem 0;
}

.score-line {
  display: flex;
  justify-content: space-between;
  margin: 1rem 0;
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 1.2rem;
}

.player {
  font-weight: 500;
}

.blue {
  color: #2196f3;
}

.red {
  color: #f44336;
}

.points {
  font-weight: 600;
}

.actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}

.action-button {
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 4px;
  background: #4caf50;
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s;
}

.action-button:hover {
  background: #45a049;
}

.winner-announcement {
  font-size: 2rem;
  font-weight: bold;
  margin: 1rem 0;
  text-transform: uppercase;
}

.draw {
  color: #757575;
}
</style>
