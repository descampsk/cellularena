<template>
  <div :class="['player-info', playerClass, { active: isActive }]">
    <div class="header">
      <h3>{{ playerName }}</h3>
      <div class="score-box">{{ score }}</div>
    </div>
    <div class="proteins-container">
      <div v-for="protein in ['A', 'B', 'C', 'D']" :key="protein" class="protein-box">
        <div class="protein-info">
          <img
            :src="loadProteinImage(protein as ProteinType)"
            :alt="protein"
            class="protein-image"
          />
          <div class="protein-count">{{ temporaryProteins[protein as ProteinType] }}</div>
          <div class="protein-gain">
            (+{{ state.proteinGainsPerPlayer[playerId][protein as ProteinType] }})
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Owner } from '@/game/Entity'
import { Game } from '@/game/Game'
import { State, type ProteinType } from '@/game/State'
import { defineComponent, type PropType } from 'vue'

export default defineComponent({
  props: {
    state: {
      type: State,
      required: true,
    },
    temporaryProteins: {
      type: Object as PropType<Record<ProteinType, number>>,
      required: true,
    },
    playerId: {
      type: Number as PropType<Owner.ONE | Owner.TWO>,
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
      const proteins = this.isActive
        ? this.temporaryProteins
        : this.state.proteinsPerPlayer[this.playerId]
      return `A: ${proteins.A}, B: ${proteins.B}, C: ${proteins.C}, D: ${proteins.D}`
    },
    gainsDisplay(): string {
      const gains = this.state.proteinGainsPerPlayer[this.playerId]
      return `A: ${gains.A}, B: ${gains.B}, C: ${gains.C}, D: ${gains.D}`
    },
  },
  methods: {
    loadProteinImage(protein: ProteinType): string {
      return new URL(`../assets/${protein.toLowerCase()}.png`, import.meta.url).href
    },
  },
})
</script>

<style scoped>
/* Base container */
.player-info {
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  background-color: #f8f9fa;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Header section */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.score-box {
  background-color: #2c3e50;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-weight: bold;
  min-width: 1.5rem;
  text-align: center;
}

/* Proteins grid */
.proteins-container {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  flex-wrap: nowrap;
}

.protein-box {
  flex: 1;
  background-color: rgb(203, 252, 215);
  border-radius: 6px;
  padding: 0.375rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  min-width: 0;
}

.protein-info {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  justify-content: center;
}

.protein-image {
  width: 1.25rem;
  height: 1.25rem;
  object-fit: contain;
}

.protein-count {
  font-weight: bold;
  font-size: 1rem;
}

.protein-gain {
  font-size: 0.7rem;
  color: #2ecc71;
}

/* Player themes */
.player-blue {
  border-left: 4px solid #2196f3;
}
.player-red {
  border-left: 4px solid #f44336;
}
.player-blue.active {
  background-color: #c0bcfa;
}
.player-red.active {
  background-color: #fcc9d0;
}
.player-blue.active .score-box {
  background-color: #1565c0;
}
.player-red.active .score-box {
  background-color: #c01515;
}

/* Responsive design */
@media (max-width: 1300px) {
  .player-info {
    padding: 0.35rem;
  }

  .header {
    margin-bottom: 0.2rem;
  }

  .header h3 {
    font-size: 0.7rem;
  }

  .score-box {
    padding: 0.125rem 0.375rem;
    font-size: 0.75rem;
    min-width: 1rem;
  }

  .proteins-container {
    gap: 0.2rem;
  }

  .protein-box {
    padding: 0.2rem;
  }

  .protein-image {
    width: 1rem;
    height: 1rem;
  }

  .protein-count {
    font-size: 0.75rem;
  }

  .protein-gain {
    font-size: 0.6rem;
  }
}

/* Pour très petits écrans en mode paysage */
@media (max-height: 500px) and (orientation: landscape) {
  .player-info {
    padding: 0.25rem;
    max-width: 300px;
  }

  .header {
    margin-bottom: 0.125rem;
  }

  .protein-box {
    padding: 0.125rem;
  }

  .protein-image {
    width: 0.875rem;
    height: 0.875rem;
  }

  .protein-count {
    font-size: 0.7rem;
  }

  .protein-gain {
    font-size: 0.5rem;
  }
}
</style>
