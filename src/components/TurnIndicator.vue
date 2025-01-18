<template>
  <div class="turn-indicator">
    <div class="turn-label">Turn</div>
    <div class="turn-number">{{ turn }}</div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'TurnIndicator',
  props: {
    turn: {
      type: Number,
      required: true,
    },
  },
})
</script>

<style scoped>
.turn-indicator {
  background: rgba(0, 0, 0, 0.8);
  border: 2px solid #4caf50;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 80px;
  box-shadow: 0 0 15px rgba(76, 175, 80, 0.3);
}

.turn-label {
  font-size: clamp(0.8rem, 2.5vw, 1rem);
  color: #4caf50;
  text-transform: uppercase;
  margin-bottom: 0.2rem;
}

.turn-number {
  font-size: clamp(1.2rem, 3.5vw, 1.5rem);
  font-weight: bold;
}

/* Landscape mode on mobile */
@media (max-height: 500px) and (orientation: landscape) {
  .turn-indicator {
    flex-direction: row;
    gap: 0.5rem;
    padding: 0.3rem 0.8rem;
  }

  .turn-label {
    margin-bottom: 0;
  }
}
</style>
