<template>
  <div :class="['player-info', playerClass, { active: isActive }]">
    <h3>{{ playerName }}</h3>
    <div>Score: {{ score }}</div>
    <div>Proteins: {{ proteinsDisplay }}</div>
    <div>Gains: {{ gainsDisplay }}</div>
  </div>
</template>

<script lang="ts">
import { Owner } from '@/game/Entity'
import { Game } from '@/game/Game'
import { State } from '@/game/State'
import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    state: {
      type: State,
      required: true,
    },
    playerId: {
      type: Number,
      required: true,
    },
    isActive: {
      type: Boolean,
      required: true,
    },
    game: {
      type: Game,
      required: true,
    },
  },
  data() {
    return {
      copyStatus: 'Share Link',
    }
  },
  computed: {
    playerName(): string {
      return this.playerId === Owner.ONE ? 'Player 1 (Blue)' : 'Player 2 (Red)'
    },
    playerClass(): string {
      return this.playerId === Owner.ONE ? 'player-blue' : 'player-red'
    },
    score(): number {
      return this.state.entities.filter((e) => e.owner === this.playerId).length
    },
    proteinsDisplay(): string {
      const proteins = this.state.proteinsPerPlayer[this.playerId as Owner.ONE | Owner.TWO]
      return `A: ${proteins.A}, B: ${proteins.B}, C: ${proteins.C}, D: ${proteins.D}`
    },
    gainsDisplay(): string {
      const gains = this.state.proteinGainsPerPlayer[this.playerId as Owner.ONE | Owner.TWO]
      return `A: ${gains.A}, B: ${gains.B}, C: ${gains.C}, D: ${gains.D}`
    },
  },
  methods: {},
})
</script>

<style scoped>
.player-info {
  padding: 15px;
  border: 1px solid #ccc;
  border-radius: 5px;
  background-color: #f5f5f5;
  min-width: 200px;
}

.player-blue {
  border-left: 4px solid #2196f3;
}

.player-red {
  border-left: 4px solid #f44336;
}

.player-blue.active {
  border-color: #2196f3;
  background-color: #e3f2fd;
}

.player-red.active {
  border-color: #f44336;
  background-color: #ffebee;
}

.player-info h3 {
  margin-top: 0;
  margin-bottom: 10px;
}
</style>
