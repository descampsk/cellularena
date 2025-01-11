<template>
  <div class="action-container">
    <div class="action-input">
      <table>
        <thead>
          <tr>
            <th>Root</th>
            <th>Action</th>
            <th>Remove</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="[rootId, action] in Object.entries(actions)" :key="Number(rootId)">
            <td>{{ rootId }}</td>
            <td>{{ action }}</td>
            <td><button @click="removeAction(Number(rootId))">X</button></td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="action-buttons">
      <button v-if="canSubmitActions" @click="processActions">Apply Actions</button>
      <button v-else disabled>Waiting for the other player</button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'

export default defineComponent({
  props: {
    actions: {
      type: Object as PropType<Record<number, string>>,
      required: true,
    },
    removeAction: {
      type: Function as PropType<(index: number) => void>,
      required: true,
    },
    processActions: {
      type: Function as PropType<() => void>,
      required: true,
    },
    canSubmitActions: {
      type: Boolean,
      required: true,
    },
  },
})
</script>

<style scoped>
.action-container {
  position: -webkit-sticky;
  position: sticky;
  top: 20px;
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
  -ms-flex-direction: column;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  height: -webkit-fit-content;
  height: -moz-fit-content;
  height: fit-content;
  background: white;
}

.action-input {
  height: 400px;
  overflow-y: auto;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: white;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  position: sticky;
  top: 0;
  background: white;
  z-index: 1;
  border-bottom: 2px solid #ccc;
}

th,
td {
  padding: 8px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.action-buttons {
  text-align: center;
}

button {
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  background-color: #4caf50;
  color: white;
  cursor: pointer;
  -webkit-transition: background-color 0.3s;
  transition: background-color 0.3s;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}
</style>
