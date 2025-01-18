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

        <!-- New bot selection -->
        <div v-if="settings.mode === 'solo'" class="form-group">
          <label class="select-label">Select Bot</label>
          <div class="select-wrapper">
            <select v-model="settings.botName">
              <option v-for="name in availableBots" :key="name" :value="name">
                {{ name }} (ELO: {{ Bots[name].elo }})
              </option>
            </select>
            <span v-if="settings.botName" class="info-icon"
              >ⓘ
              <div class="tooltip bot-tooltip">
                <div class="bot-info">
                  <div class="bot-description">{{ Bots[settings.botName].description }}</div>
                  <div class="bot-availability">
                    <span
                      :class="[
                        'availability-badge',
                        Bots[settings.botName].availibility.toLowerCase(),
                      ]"
                    >
                      {{ Bots[settings.botName].availibility }}
                    </span>
                  </div>
                </div>
              </div>
            </span>
          </div>
        </div>

        <div class="dialog-buttons">
          <button class="cancel-button" @click="close">Cancel</button>
          <button
            class="create-button"
            @click="createGame(settings)"
            :disabled="settings.mode === 'solo' && !settings.botName"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script lang="ts">
import { BotNames, Bots, type BotName } from '@/game/Bot'
import type { GameMode, GameSettings } from '@/game/Game'
import { defineComponent, ref, computed, type PropType } from 'vue'
import { useRoute } from 'vue-router'

export default defineComponent({
  name: 'CreateGameDialog',
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    createGame: {
      type: Function as PropType<(settings: GameSettings) => void>,
      required: true,
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const route = useRoute()
    const settings = ref({
      mode: 'versus' as GameMode,
      botName: 'Apofils' as BotName | null,
    })

    const availableBots = computed(() => {
      const availability = route.query.availability as string | undefined
      return BotNames.filter((name) => {
        const bot = Bots[name]
        return bot.availibility !== 'ALPHA' || availability?.toUpperCase() === 'ALPHA'
      })
    })

    const close = () => {
      emit('update:modelValue', false)
    }

    return {
      settings,
      close,
      Bots,
      availableBots,
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

/* New styles for bot selection */
.bot-tooltip {
  min-width: 200px;
}

.bot-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.bot-description {
  font-size: 0.9rem;
  line-height: 1.4;
}

.bot-availability {
  display: flex;
  justify-content: flex-end;
}

.availability-badge {
  font-size: 0.8rem;
  padding: 0.2rem 0.5rem;
  border-radius: 3px;
  font-weight: bold;
}

.availability-badge.ga {
  background-color: #4caf50;
  color: white;
}

.availability-badge.alpha {
  background-color: #ff9800;
  color: black;
}

.availability-badge.beta {
  background-color: #ff9800;
  color: black;
}

/* Responsive adjustments for bot selection */
@media (max-width: 768px) {
  .bot-tooltip {
    min-width: 150px;
  }

  .bot-description {
    font-size: 0.8rem;
  }

  .availability-badge {
    font-size: 0.7rem;
    padding: 0.15rem 0.4rem;
  }
}

@media (max-height: 500px) and (orientation: landscape) {
  .bot-tooltip {
    width: 180px;
  }
}
</style>
