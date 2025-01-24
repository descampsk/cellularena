<template>
  <Transition name="dialog">
    <div v-if="show" class="dialog-overlay" @click="$emit('close')">
      <div class="dialog-content" @click.stop>
        <h2>Select Map</h2>
        <p>Do you want to play on the same map or generate a new one?</p>
        <div class="dialog-buttons">
          <button class="action-button same-map" @click="$emit('select', 'same')">Same Map</button>
          <button class="action-button new-map" @click="$emit('select', 'new')">New Map</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'NewGameDialog',
  props: {
    show: {
      type: Boolean,
      required: true,
    },
  },
  emits: ['close', 'select'],
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
  margin: 0 0 1rem;
  text-align: center;
  color: #4caf50;
  font-size: clamp(1.2rem, 4vw, 1.5rem);
}

p {
  text-align: center;
  margin-bottom: 1.5rem;
  font-size: clamp(0.9rem, 3vw, 1.1rem);
  line-height: 1.4;
}

.dialog-buttons {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.action-button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: clamp(0.9rem, 3vw, 1rem);
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;
  color: white;
}

.same-map {
  background: #2196f3;
}

.same-map:hover {
  background: #1976d2;
  box-shadow: 0 0 10px rgba(33, 150, 243, 0.5);
}

.new-map {
  background: #4caf50;
}

.new-map:hover {
  background: #45a049;
  box-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
}

.dialog-enter-active,
.dialog-leave-active {
  transition: opacity 0.3s ease;
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}

/* Landscape mode on mobile */
@media (max-height: 500px) and (orientation: landscape) {
  .dialog-content {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    padding: 1rem;
  }

  h2 {
    width: 100%;
    margin-bottom: 0.5rem;
    font-size: 1.1rem;
  }

  p {
    width: 100%;
    margin-bottom: 1rem;
    font-size: 0.9rem;
  }

  .dialog-buttons {
    width: 100%;
    margin-top: 0;
  }

  .action-button {
    padding: 0.4rem 0.8rem;
    font-size: 0.9rem;
    min-width: 100px;
  }
}
</style>
