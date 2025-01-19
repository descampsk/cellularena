<template>
  <div v-if="show" class="dialog-backdrop" @click.self="$emit('close')">
    <div class="dialog-content">
      <img src="@/assets/cellularena.png" alt="Cellularena" class="logo" />

      <div class="winner-announcement" :class="winnerClass">
        {{ winnerAnnouncement }}
      </div>

      <div class="win-reason" :class="winnerClass">
        {{ winReason }}
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
    winReason: {
      type: String,
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
        botName: this.game.botName,
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
  padding: 1rem;
}

.dialog-content {
  background: rgba(255, 255, 255, 0.05);
  padding: clamp(1rem, 3vw, 2rem);
  border-radius: 8px;
  text-align: center;
  width: min(90%, 500px);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.logo {
  width: min(80%, 300px);
  height: auto;
  margin: 0 auto;
}

.winner-announcement {
  font-size: clamp(1.5rem, 5vw, 2rem);
  font-weight: bold;
  margin: 0;
  text-transform: uppercase;
}

.win-reason {
  font-size: clamp(0.9rem, 3vw, 1.1rem);
  text-align: center;
  margin: -0.5rem 0 0.5rem;
  opacity: 0.9;
  font-style: italic;
}

.win-reason.blue {
  color: #2196f3;
}

.win-reason.red {
  color: #f44336;
}

.win-reason.draw {
  color: #757575;
}

.scores {
  margin: 0.5rem 0;
}

.score-line {
  display: flex;
  justify-content: space-between;
  margin: 0.5rem 0;
  padding: 0.5rem;
  border-radius: 4px;
  font-size: clamp(1rem, 3vw, 1.2rem);
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
.draw {
  color: #757575;
}

.points {
  font-weight: 600;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
  margin-top: 0.5rem;
}

.action-button {
  padding: clamp(0.5rem, 2vw, 0.8rem) clamp(1rem, 3vw, 1.5rem);
  border: none;
  border-radius: 4px;
  background: #4caf50;
  color: white;
  font-weight: 500;
  font-size: clamp(0.9rem, 2.5vw, 1rem);
  cursor: pointer;
  transition: background-color 0.3s;
  min-width: clamp(80px, 20vw, 120px);
}

.action-button:hover {
  background: #45a049;
}

/* Landscape mode adaptations */
@media (max-height: 600px) and (orientation: landscape) {
  .dialog-content {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
    padding: 1rem;
  }

  .logo {
    width: min(30%, 200px);
    margin: 0;
  }

  .winner-announcement {
    flex: 1;
    min-width: 200px;
    text-align: left;
    font-size: clamp(1.2rem, 4vw, 1.5rem);
  }

  .win-reason {
    width: 100%;
    text-align: left;
    font-size: clamp(0.8rem, 2.5vw, 1rem);
    margin: 0;
  }

  .scores {
    width: 100%;
    margin: 0;
  }

  .score-line {
    margin: 0.25rem 0;
    padding: 0.25rem;
  }

  .actions {
    width: 100%;
    margin-top: 0.25rem;
  }

  .action-button {
    padding: 0.4rem 0.8rem;
    font-size: 0.9rem;
  }
}

/* Very small screens */
@media (max-width: 360px), (max-height: 400px) {
  .dialog-content {
    padding: 0.75rem;
    gap: 0.25rem;
  }

  .logo {
    width: 70%;
  }

  .winner-announcement {
    font-size: 1.2rem;
  }

  .win-reason {
    font-size: 0.8rem;
    margin: -0.25rem 0 0.25rem;
  }

  .score-line {
    font-size: 0.9rem;
    padding: 0.25rem;
  }

  .action-button {
    padding: 0.4rem 0.6rem;
    font-size: 0.8rem;
    min-width: 70px;
  }
}
</style>
