<template>
  <Transition name="dialog">
    <div v-if="modelValue" class="dialog-overlay" @click="close">
      <div class="dialog-content" @click.stop>
        <div class="title-container">
          <h2>Replay a Game</h2>
          <span class="info-icon">
            ⓘ
            <div class="tooltip">
              The Game ID is the first UUID in the URL of a game.<br />
              Example: In /game/<strong>abc123</strong>/player/xyz789,<br />
              the Game ID is "abc123"
            </div>
          </span>
        </div>
        <div class="form-group">
          <label for="gameId" class="select-label">Game ID</label>
          <input
            id="gameId"
            v-model="gameId"
            type="text"
            placeholder="Enter game ID"
            class="game-id-input"
          />
          <label for="playerColor" class="select-label">Player Color</label>
          <select id="playerColor" v-model="selectedPlayer" class="player-select">
            <option :value="Owner.ONE">Blue Player</option>
            <option :value="Owner.TWO">Red Player</option>
          </select>
          <p v-if="error" class="error-message">{{ error }}</p>
        </div>
        <div class="dialog-buttons">
          <button class="cancel-button" @click="close">Cancel</button>
          <button class="create-button" @click="handleReplay" :disabled="!gameId">
            Watch Replay
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script lang="ts">
import { gameFirestoreConvertor } from '@/game/Game'
import { firebaseAnalytics } from '@/infra/firebase'
import { logEvent } from 'firebase/analytics'
import { getDoc, doc } from 'firebase/firestore'
import { defineComponent } from 'vue'
import { useFirestore } from 'vuefire'
import { Owner } from '@/game/Entity'

export default defineComponent({
  name: 'CreateGameDialog',
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
  },
  emits: ['update:modelValue'],
  data: () => ({
    gameId: '',
    error: '',
    selectedPlayer: Owner.ONE,
    Owner,
  }),
  setup(props, { emit }) {
    const close = () => {
      emit('update:modelValue', false)
    }

    return {
      close,
    }
  },
  methods: {
    async handleReplay() {
      if (!this.gameId.trim()) {
        this.error = 'Please enter a valid Game ID'
        return
      }
      this.error = ''
      const gameId = this.gameId.trim()

      try {
        const gameRef = doc(useFirestore(), 'games', gameId).withConverter(gameFirestoreConvertor)
        const gameDoc = await getDoc(gameRef)

        if (!gameDoc.exists()) {
          this.error = 'Game not found'
          return
        }

        const playerUuids = Object.entries(gameDoc.data()!.playerIds)
        const selectedPlayerUuid = playerUuids.find(([, id]) => id === this.selectedPlayer)?.[0]

        if (!selectedPlayerUuid) {
          this.error = 'Selected player not found'
          return
        }

        logEvent(firebaseAnalytics, 'watch_replay', {
          gameId: gameId,
          selectedPlayerUuid: this.selectedPlayer === Owner.ONE ? 'blue' : 'red',
        })

        this.close()
        this.$router.push(`/replay/${gameId}/player/${selectedPlayerUuid}`)
      } catch (error) {
        console.error('Error launching replay:', error)
        this.error = 'Failed to load game'
      }
    },
  },
  watch: {
    modelValue(newValue) {
      if (!newValue) {
        this.gameId = ''
        this.error = ''
      }
    },
  },
})
</script>

<style scoped>
/* Base styles */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
  padding: 1rem;
}

.dialog-content {
  background: rgba(0, 0, 0, 0.9);
  border: 2px solid #4caf50;
  border-radius: 8px;
  padding: 1.5rem;
  width: 100%;
  max-width: 400px;
  color: white;
  box-shadow: 0 0 20px rgba(76, 175, 80, 0.3);
}

/* Title section */
.title-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

h2 {
  margin: 0;
  color: #4caf50;
  font-size: clamp(1.2rem, 4vw, 1.5rem);
}

/* Form elements */
.form-group {
  margin-bottom: 1.5rem;
}

.select-label {
  display: block;
  margin-bottom: 0.5rem;
  color: white;
  font-size: clamp(0.9rem, 3vw, 1rem);
}

.game-id-input,
.player-select {
  width: 95%;
  padding: 0.5rem;
  background-color: #333;
  color: white;
  border: 1px solid #4caf50;
  border-radius: 4px;
  font-size: clamp(0.9rem, 3vw, 1rem);
  margin-bottom: 1rem;
}

/* Buttons */
.dialog-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: clamp(0.9rem, 3vw, 1rem);
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 80px;
}

.create-button {
  background: #4caf50;
  color: white;
}

.create-button:hover {
  background: #45a049;
}

.create-button:disabled {
  background: #666;
  cursor: not-allowed;
}

.cancel-button {
  background: transparent;
  color: white;
  border: 1px solid white;
}

.cancel-button:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* Info tooltip */
.info-icon {
  position: relative;
  cursor: help;
  color: #4caf50;
  font-size: clamp(1rem, 3vw, 1.2rem);
  padding: 0.25rem;
}

.tooltip {
  display: none;
  position: absolute;
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  margin-left: 0.5rem;
  padding: 0.75rem;
  background-color: rgba(0, 0, 0, 0.95);
  border: 1px solid #4caf50;
  border-radius: 4px;
  font-size: clamp(0.8rem, 2.5vw, 0.9rem);
  line-height: 1.4;
  z-index: 100;
  width: max-content;
  max-width: 250px;
}

.info-icon:hover .tooltip {
  display: block;
}

.error-message {
  color: #ff4444;
  font-size: clamp(0.8rem, 2.5vw, 0.9rem);
  margin: 0.5rem 0;
}

/* Transitions */
.dialog-enter-active,
.dialog-leave-active {
  transition: opacity 0.3s ease;
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}

/* Landscape mode adaptations */
@media (max-height: 500px) and (orientation: landscape) {
  .dialog-content {
    padding: 1rem;
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .title-container {
    width: 100%;
    margin-bottom: 0.5rem;
  }

  .form-group {
    flex: 1;
    min-width: 200px;
    margin-bottom: 0;
  }

  .dialog-buttons {
    width: 100%;
    margin-top: 0.5rem;
  }

  .tooltip {
    left: 50%;
    bottom: 100%;
    top: auto;
    transform: translateX(-50%);
    margin-left: 0;
    margin-bottom: 0.5rem;
  }

  .tooltip::after {
    content: '';
    position: absolute;
    bottom: -5px;
    left: 50%;
    transform: translateX(-50%);
    border-width: 5px 5px 0;
    border-style: solid;
    border-color: #4caf50 transparent transparent;
  }
}
</style>
