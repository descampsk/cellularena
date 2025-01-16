<template>
  <Transition name="dialog">
    <div v-if="modelValue" class="dialog-overlay" @click="close">
      <div class="dialog-content" @click.stop>
        <h2>Create New Game</h2>
        <div class="form-group">
          <label class="select-label">Game Mode</label>
          <div class="select-wrapper">
            <select v-model="settings.mode">
              <option value="training">Training</option>
              <option value="solo">Solo vs AI</option>
              <option value="versus">Versus</option>
            </select>
            <span class="info-icon"
              >ⓘ
              <div class="tooltip">
                <div v-if="settings.mode === 'training'">
                  Control both players to practice strategies
                </div>
                <div v-if="settings.mode === 'solo'">Challenge yourself against an AI opponent</div>
                <div v-if="settings.mode === 'versus'">Compete against another player</div>
              </div>
            </span>
          </div>
        </div>
        <div class="dialog-buttons">
          <button class="cancel-button" @click="close">Cancel</button>
          <button class="create-button" @click="createGame(settings)">Create</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script lang="ts">
import type { GameMode } from '@/game/Game'
import { defineComponent, ref, type PropType } from 'vue'

export default defineComponent({
  name: 'CreateGameDialog',
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    createGame: {
      type: Function as PropType<(settings: { mode: GameMode }) => void>,
      required: true,
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const settings = ref({
      mode: 'versus' as GameMode,
    })

    const close = () => {
      emit('update:modelValue', false)
    }

    return {
      settings,
      close,
    }
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

h2 {
  margin: 0 0 1.5rem;
  text-align: center;
  color: #4caf50;
  font-size: clamp(1.2rem, 4vw, 1.5rem);
}

.form-group {
  margin-bottom: 1rem;
}

/* Select styles */
.select-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.select-label {
  display: block;
  margin-bottom: 0.5rem;
  color: white;
  font-size: clamp(0.9rem, 3vw, 1rem);
}

select {
  flex: 1;
  padding: 0.5rem;
  background-color: #333;
  color: white;
  border: 1px solid #4caf50;
  border-radius: 4px;
  font-size: clamp(0.9rem, 3vw, 1rem);
  min-height: 2.5rem;
}

/* Button styles */
.dialog-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
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

/* Tooltip styles */
.info-icon {
  position: relative;
  cursor: help;
  color: #4caf50;
  font-size: clamp(1rem, 3vw, 1.2rem);
  padding: 0.25rem;
}

.info-icon:hover .tooltip {
  display: block;
}

.tooltip {
  display: none;
  position: absolute;
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  margin-left: 0.5rem;
  padding: 0.5rem;
  background-color: rgba(0, 0, 0, 0.95);
  border: 1px solid #4caf50;
  border-radius: 4px;
  font-size: clamp(0.8rem, 2.5vw, 0.9rem);
  z-index: 100;
  width: max-content;
  max-width: 200px;
  white-space: normal;
}

/* Responsive styles */
@media (max-width: 768px) {
  .dialog-content {
    padding: 1rem;
  }

  .dialog-buttons {
    margin-top: 1rem;
  }

  .tooltip {
    font-size: 0.8rem;
    padding: 0.4rem;
    max-width: 150px;
  }
}

/* Landscape mode on mobile */
@media (max-height: 500px) and (orientation: landscape) {
  .dialog-content {
    display: flex;
    flex-wrap: wrap;
    max-height: 90vh;
    padding: 0.75rem;
  }

  h2 {
    width: 100%;
    margin-bottom: 0.75rem;
    font-size: 1.1rem;
  }

  .form-group {
    flex: 1;
    margin-bottom: 0.5rem;
    min-width: 200px;
  }

  .dialog-buttons {
    width: 100%;
    margin-top: 0.75rem;
  }

  /* Adjust tooltip position for landscape */
  .tooltip {
    left: 50%;
    bottom: 100%;
    top: auto;
    transform: translateX(-50%);
    margin-left: 0;
    margin-bottom: 0.5rem;
  }

  /* Add arrow for landscape mode */
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
</style>
