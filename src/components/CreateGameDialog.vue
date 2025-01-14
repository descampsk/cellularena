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
</style>
