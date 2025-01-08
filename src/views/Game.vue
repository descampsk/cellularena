<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div>
    <div id="proteinsDisplay">Proteins: A: 0, B: 0, C: 0, D: 0</div>
    <div id="proteinsGainsDisplay">Proteins Gains: A: 0, B: 0, C: 0, D: 0</div>
    <div id="infoDisplay">Hover over a cell to see its details</div>
    <canvas ref="gameCanvas"></canvas>
    <div id="statusIndicator" style="text-align: center; margin-top: 10px">
      <span
        id="statusIcon"
        :style="{
          display: 'inline-block',
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          backgroundColor: isPaused ? 'red' : 'green',
          marginRight: '5px',
        }"
      ></span>
      <span id="statusText" style="font-size: 18px">{{ isPaused ? 'Paused' : 'Running' }}</span>
    </div>
    <div id="controls" style="text-align: center; margin-top: 10px">
      <button @click="togglePause">{{ isPaused ? 'Resume' : 'Pause' }}</button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { Direction, EntityType, Owner } from '@/game/Entity'
import { State } from '@/game/State'
import { createImage } from '@/utils/imageLoader'

const CELL_SIZE = 48

const directionToRotation: Record<Direction, number> = {
  [Direction.E]: 0,
  [Direction.N]: -Math.PI / 2,
  [Direction.W]: Math.PI,
  [Direction.S]: Math.PI / 2,
  [Direction.X]: 0,
}

export default defineComponent({
  data() {
    return {
      mapName: '-109498249532328380',
      gameId: this.$route.params.gameId,
      state: new State(),
      isPaused: true,
      canvas: null as HTMLCanvasElement | null,
      ctx: null as CanvasRenderingContext2D | null,
      myImages: {} as Record<EntityType, HTMLImageElement>,
      oppImages: {} as Record<EntityType, HTMLImageElement>,
    }
  },
  async mounted() {
    this.canvas = this.$refs.gameCanvas as HTMLCanvasElement
    this.ctx = this.canvas.getContext('2d')

    await this.loadImages()
    await this.initializeGame()

    this.setupMouseEvents()
    this.drawGrid()
  },
  methods: {
    async initializeGame() {
      const inputs = await this.loadMap(this.mapName)
      this.state.setMapSize(inputs.shift()!)
      this.state.refreshState(inputs)

      if (this.canvas) {
        this.canvas.width = this.state.width * CELL_SIZE
        this.canvas.height = this.state.height * CELL_SIZE
      }
    },
    drawGrid() {
      if (!this.ctx || !this.canvas) return

      const ctx = this.ctx
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

      // Draw base grid
      for (let row = 0; row < this.state.height; row++) {
        for (let col = 0; col < this.state.width; col++) {
          const x = col * CELL_SIZE
          const y = row * CELL_SIZE
          const cell = this.state.getEntityAt({ x: col, y: row }).type

          // Draw cell background
          ctx.fillStyle = cell === EntityType.WALL ? '#808080' : 'white'
          ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE)

          // Draw cell border
          ctx.strokeStyle = 'black'
          ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE)
        }
      }

      // Draw entities
      for (const entity of this.state.entities) {
        const x = entity.x * CELL_SIZE
        const y = entity.y * CELL_SIZE
        const img =
          entity.owner === Owner.ME ? this.myImages[entity.type] : this.oppImages[entity.type]
        const rotation = directionToRotation[entity.organDir]

        if (img) {
          ctx.save()
          ctx.translate(x + CELL_SIZE / 2, y + CELL_SIZE / 2)
          if (rotation !== 0) {
            ctx.rotate(rotation)
          }
          ctx.drawImage(img, -CELL_SIZE / 2, -CELL_SIZE / 2, CELL_SIZE, CELL_SIZE)
          ctx.restore()
        }
      }
    },
    setupMouseEvents() {
      if (!this.canvas) return

      this.canvas.addEventListener('mousemove', (event) => {
        const rect = this.canvas!.getBoundingClientRect()
        const mouseX = event.clientX - rect.left
        const mouseY = event.clientY - rect.top

        const col = Math.floor(mouseX / CELL_SIZE)
        const row = Math.floor(mouseY / CELL_SIZE)

        if (col >= 0 && col < this.state.width && row >= 0 && row < this.state.height) {
          const entity = this.state.entities.find((e) => e.x === col && e.y === row)
          const info = entity
            ? JSON.stringify({
                x: entity.x,
                y: entity.y,
                type: entity.type,
                owner: entity.owner,
                organId: entity.organId,
                organRootId: entity.organRootId,
                organDir: entity.organDir,
              })
            : `${col},${row}`

          const infoDisplay = document.getElementById('infoDisplay')
          if (infoDisplay) {
            infoDisplay.textContent = info
          }
        }
      })
    },
    togglePause() {
      this.isPaused = !this.isPaused
    },
    async loadMap(mapName: string) {
      try {
        const response = await fetch(`/maps/${mapName}`)
        console.log('Attempting to fetch:', `/maps/${mapName}`)

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const content = await response.text()
        console.log('Map content:', content)
        return content.split('\n')
      } catch (error) {
        console.error('Error loading map:', error)
        throw error
      }
    },
    async loadImages() {
      const imageUrls: Record<EntityType, string> = {
        0: 'wall.png',
        1: 'wall.png',
        2: '0_root.png',
        3: '0_basic.png',
        4: '0_harvester.png',
        5: '0_tentacle.png',
        6: '0_sporer.png',
        7: 'a.png',
        8: 'b.png',
        9: 'c.png',
        10: 'd.png',
      }

      // Load my images
      for (const [key, url] of Object.entries(imageUrls)) {
        this.myImages[key as unknown as EntityType] = await createImage(url)
      }

      // Load opponent images
      const oppImageUrls = { ...imageUrls }
      for (let i = 2; i <= 6; i++) {
        oppImageUrls[i as EntityType] = oppImageUrls[i as EntityType].replace('0_', '1_')
      }

      for (const [key, url] of Object.entries(oppImageUrls)) {
        this.oppImages[key as unknown as EntityType] = await createImage(url)
      }
    },
  },
})
</script>

<style>
#gameCanvas {
  border: 1px solid black;
  display: block;
  margin: 20px auto;
}
#proteinsDisplay {
  text-align: center;
  font-family: Arial, sans-serif;
  margin-bottom: 10px;
  font-size: 16px;
}
#proteinsGainsDisplay {
  text-align: center;
  font-family: Arial, sans-serif;
  margin-bottom: 10px;
  font-size: 16px;
}
#infoDisplay {
  text-align: center;
  margin-bottom: 10px;
  font-family: Arial, sans-serif;
  font-size: 14px;
  color: #333;
}
</style>
