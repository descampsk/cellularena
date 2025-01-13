<template>
  <div class="popup" v-if="visible" @click.self="closePopup">
    <div class="popup-content">
      <h3>Select Action in {{ x }}, {{ y }}</h3>
      <div v-for="organ in organTypes" :key="organ">
        <div v-if="isDirectional(organ)">
          <div
            style="display: flex; flex-direction: row; justify-content: center; align-items: center"
          >
            {{ organ }}
            <!-- <img src="../assets/a.png" style="width: 20px; height: 20px" /> -->
            <!-- <img src="../assets/b.png" style="width: 20px; height: 20px" /> -->
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
          <div>{{ organ }}</div>
          <div class="organs">
            <img
              :src="getImage(organ)"
              :style="getStyle(organ as OrganType, Direction.X)"
              @click="selectAction(organ as OrganType, Direction.X)"
            />
          </div>
        </div>
      </div>
      <button @click="closePopup">Cancel</button>
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
      // Import all images from the assets directory
      const images = import.meta.glob('../assets/*.png', { eager: true })
      const imagePath = `../assets/${this.playerId}_${organ.toLowerCase()}.png`

      // Find the image in the imported assets
      const image = images[imagePath] as { default: string } | undefined
      if (!image) {
        console.error(`Image not found: ${imagePath}`)
        return ''
      }

      return image.default
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
        width: '30px',
        height: '30px',
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
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: white;
  border: 1px solid #ccc;
  border-radius: 5px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.popup::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.9);
  z-index: -1;
}

.popup-content {
  padding: 20px;
  text-align: center;
}

.organs img {
  margin: 5px;
}

img {
  -webkit-transition: transform 0.3s ease;
  transition: transform 0.3s ease;
}

.organ-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 5px;
}

.protein-costs {
  display: flex;
  gap: 4px;
}

.protein-icon {
  width: 20px;
  height: 20px;
  opacity: 0.3;
  transition: opacity 0.3s ease;
}

.protein-icon.required {
  opacity: 1;
}
</style>
