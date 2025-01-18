<template>
  <div class="popup" v-if="visible" @click.self="closePopup">
    <div class="popup-content">
      <div v-for="organ in organTypes" :key="organ">
        <div v-if="isDirectional(organ)">
          <div class="organ-header">
            <span class="organ-name">{{ organ }}</span>
            <div class="protein-requirements">
              <img
                v-for="protein in proteinsImagePerOrgan[organ as OrganType]"
                :key="protein"
                :src="getProteinImage(protein)"
                class="protein-icon"
              />
            </div>
          </div>
          <div class="organs">
            <img
              v-for="direction in directions"
              :key="direction"
              :src="getImage(organ)"
              :style="getStyle(organ as OrganType, direction)"
              @click="selectAction(organ as OrganType, direction)"
            />
          </div>
        </div>
        <div v-else>
          <div class="organ-header">
            <span class="organ-name">{{ organ }}</span>
            <div class="protein-requirements">
              <img
                v-for="protein in proteinsImagePerOrgan[organ as OrganType]"
                :key="protein"
                :src="getProteinImage(protein)"
                class="protein-icon"
              />
            </div>
          </div>
          <div class="organs">
            <img
              :src="getImage(organ)"
              :style="getStyle(organ as OrganType, Direction.X)"
              @click="selectAction(organ as OrganType, Direction.X)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType, type StyleValue } from 'vue'
import { Direction, EntityType } from '@/game/Entity'
import { ProteinsPerOrgan, type OrganType, type ProteinType } from '@/game/State'

export default defineComponent({
  props: {
    visible: {
      type: Boolean,
      required: true,
    },
    x: {
      type: Number,
      required: true,
    },
    y: {
      type: Number,
      required: true,
    },
    playerId: {
      type: Number,
      required: true,
    },
    temporaryProteins: {
      type: Object as PropType<Record<ProteinType, number>>,
      required: true,
    },
    onClose: {
      type: Function as PropType<() => void>,
      required: true,
    },
    onSelect: {
      type: Function as PropType<(organ: OrganType, direction: Direction) => void>,
      required: true,
    },
  },
  data() {
    return {
      Direction,
      organTypes: [
        EntityType.BASIC,
        EntityType.ROOT,
        EntityType.HARVESTER,
        EntityType.TENTACLE,
        EntityType.SPORER,
      ],
      directions: [Direction.N, Direction.E, Direction.S, Direction.W],
    }
  },
  computed: {
    proteinsImagePerOrgan(): Record<OrganType, string[]> {
      return {
        [EntityType.BASIC]: ['a'],
        [EntityType.ROOT]: ['a', 'b', 'c', 'd'],
        [EntityType.HARVESTER]: ['c', 'd'],
        [EntityType.TENTACLE]: ['b', 'c'],
        [EntityType.SPORER]: ['b', 'd'],
      }
    },
  },
  methods: {
    hasEnoughProteins(organ: OrganType): boolean {
      const cost = ProteinsPerOrgan[organ]
      const hasEnough = Object.entries(cost).every(
        ([protein, value]) => value <= this.temporaryProteins[protein as ProteinType],
      )
      return hasEnough
    },
    isDirectional(organ: EntityType): boolean {
      return [EntityType.HARVESTER, EntityType.TENTACLE, EntityType.SPORER].includes(organ)
    },
    getImage(organ: EntityType): string {
      return new URL(`../assets/${this.playerId}_${organ.toLowerCase()}.png`, import.meta.url).href
    },
    getProteinImage(protein: string): string {
      return new URL(`../assets/${protein.toLowerCase()}.png`, import.meta.url).href
    },
    getStyle(organ: OrganType, direction: Direction): StyleValue {
      const rotationDegrees = {
        [Direction.X]: 0,
        [Direction.N]: -90,
        [Direction.E]: 0,
        [Direction.S]: 90,
        [Direction.W]: 180,
      }

      const enoughProteins = this.hasEnoughProteins(organ)
      const grayscale = enoughProteins ? 'grayscale(0)' : 'grayscale(1)'

      return {
        transform: `rotate(${rotationDegrees[direction]}deg)`,
        // width: 'clamp(6px, 6vw, 32px)',
        // height: 'clamp(6px, 6vw, 32px)',
        filter: grayscale,
        cursor: enoughProteins ? 'pointer' : undefined,
      }
    },
    selectAction(organ: OrganType, direction: Direction) {
      if (!this.hasEnoughProteins(organ)) return

      this.onSelect(organ, direction)
      this.closePopup()
    },
    closePopup() {
      this.onClose()
    },
  },
})
</script>

<style>
.popup {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  background-color: rgba(0, 0, 0, 0.2);
}

.popup-content {
  padding: min(8px, 2vw);
  text-align: center;
  border-radius: min(12px, 2vw);
  background-color: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  max-width: min(70vw, 360px);
  font-size: clamp(12px, 1.5vw, 14px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.organs {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: min(8px, 1vw);
  margin: min(4px, 1vw) 0;
}

.organs img {
  width: clamp(10px, 3vw, 32px);
  height: clamp(10px, 3vw, 32px);
  padding: clamp(3px, 0.75vw, 6px);
  border-radius: min(6px, 1vw);
  background-color: rgba(124, 46, 46, 0.781);
  transition: all 0.2s ease;
}

.organs img:hover {
  transform: scale(1.1);
  background-color: rgba(255, 255, 255, 0.25);
}

.organ-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: min(8px, 1vw);
  margin: min(4px, 1vh) 0;
}

.protein-requirements {
  display: flex;
  gap: min(4px, 0.5vw);
  align-items: center;
}

.protein-icon {
  width: clamp(8px, 2vh, 16px);
  height: clamp(8px, 2vh, 16px);
  object-fit: contain;
}

.organ-name {
  font-size: clamp(10px, 2vh, 14px);
  margin: min(4px, 1vh) 0;
  color: #130606;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}
</style>
