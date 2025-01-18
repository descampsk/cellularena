<template>
  <Transition name="dialog">
    <div v-if="show" class="dialog-overlay" @click="$emit('close')">
      <div class="dialog-content" @click.stop>
        <h2>Give Up?</h2>
        <p>Are you sure you want to give up this game? This action cannot be undone.</p>
        <div class="dialog-buttons">
          <button class="cancel-button" @click="$emit('close')">Cancel</button>
          <button class="confirm-button" @click="handleConfirm">Give Up</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'GiveUpDialog',
  props: {
    show: {
      type: Boolean,
      required: true,
    },
  },
  emits: ['close', 'confirm'],
  methods: {
    handleConfirm() {
      this.$emit('confirm')
      this.$emit('close')
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
  padding: 1rem;
}

.dialog-content {
  background: rgba(0, 0, 0, 0.9);
  border: 2px solid #f44336;
  border-radius: 8px;
  padding: 1.5rem;
  width: 100%;
  max-width: 400px;
  color: white;
  box-shadow: 0 0 20px rgba(244, 67, 54, 0.3);
}

h2 {
  margin: 0 0 1rem;
  text-align: center;
  color: #f44336;
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

button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: clamp(0.9rem, 3vw, 1rem);
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 100px;
}

.cancel-button {
  background: transparent;
  color: #fff;
  border: 1px solid #fff;
}

.cancel-button:hover {
  background: rgba(255, 255, 255, 0.1);
}

.confirm-button {
  background: #f44336;
  color: white;
}

.confirm-button:hover {
  background: #d32f2f;
  box-shadow: 0 0 10px rgba(244, 67, 54, 0.5);
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

  button {
    padding: 0.4rem 0.8rem;
    font-size: 0.9rem;
    min-width: 80px;
  }
}
</style>
