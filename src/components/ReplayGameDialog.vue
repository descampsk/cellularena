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
}

.dialog-content {
  background: rgba(0, 0, 0, 0.9);
  border: 2px solid #4caf50;
  border-radius: 8px;
  padding: 2rem;
  min-width: 300px;
  color: white;
  box-shadow: 0 0 20px rgba(76, 175, 80, 0.3);
}

h2 {
  margin: 0 0 1.5rem;
  text-align: center;
  color: #4caf50;
  font-size: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.switch {
  position: relative;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
  background-color: #333;
  border-radius: 12px;
  margin-right: 10px;
  transition: 0.4s;
}

.slider:before {
  position: absolute;
  content: '';
  height: 16px;
  width: 16px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  border-radius: 50%;
  transition: 0.4s;
}

input:checked + .slider {
  background-color: #4caf50;
}

input:checked + .slider:before {
  transform: translateX(26px);
}

.label-text {
  color: white;
  font-size: 1rem;
}

.dialog-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.create-button {
  background: #4caf50;
  color: white;
}

.create-button:hover {
  background: #45a049;
  box-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
}

.cancel-button {
  background: transparent;
  color: #fff;
  border: 1px solid #fff;
}

.cancel-button:hover {
  background: rgba(255, 255, 255, 0.1);
}

.dialog-enter-active,
.dialog-leave-active {
  transition: opacity 0.3s ease;
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}

.select-label {
  display: block;
  margin-bottom: 0.5rem;
  color: white;
}

.select-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

select {
  flex: 1;
  padding: 0.5rem;
  background-color: #333;
  color: white;
  border: 1px solid #4caf50;
  border-radius: 4px;
}

.info-icon {
  position: relative;
  cursor: help;
  color: #4caf50;
}

.tooltip {
  display: none;
  position: absolute;
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  margin-left: 0.5rem;
  padding: 0.5rem;
  background-color: rgba(0, 0, 0, 0.9);
  border: 1px solid #4caf50;
  border-radius: 4px;
  white-space: nowrap;
  z-index: 100;
  transition: opacity 0.2s;
}

.info-icon:hover .tooltip {
  display: block;
}

.title-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.game-id-input {
  width: 100%;
  padding: 0.5rem;
  background-color: #333;
  color: white;
  border: 1px solid #4caf50;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.error-message {
  color: #ff4444;
  font-size: 0.875rem;
  margin: 0.25rem 0;
}

.info-icon {
  cursor: help;
  color: #4caf50;
  position: relative;
  font-size: 1rem;
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
  white-space: nowrap;
  z-index: 100;
  font-size: 0.875rem;
  line-height: 1.4;
  min-width: 200px;
}

.info-icon:hover .tooltip {
  display: block;
}

.create-button:disabled {
  background: #666;
  cursor: not-allowed;
}

.player-select {
  width: 100%;
  padding: 0.5rem;
  background-color: #333;
  color: white;
  border: 1px solid #4caf50;
  border-radius: 4px;
  margin-top: 0.5rem;
  margin-bottom: 1rem;
  cursor: pointer;
}

.player-select option {
  background-color: #333;
  color: white;
}
</style>
