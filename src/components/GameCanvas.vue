<template>
  <canvas ref="gameCanvas" @click="handleCanvasClick"></canvas>
  <ActionSelectionPopup
    :visible="popupVisible"
    :playerId="playerId"
    :x="popupX"
    :y="popupY"
    :onClose="closePopup"
    :onSelect="addAction"
  />
</template>

<script lang="ts">
import {
  Direction,
  Entity,
  EntityType,
  getDxDyFromDirection,
  Owner,
  ProteinTypes,
} from '@/game/Entity'
import { AllDxDy, getDirection } from '@/game/helpers'
import { OrganTypes, State, type OrganType } from '@/game/State'
import { createImage } from '@/utils/imageLoader'
import { defineComponent, type PropType } from 'vue'
import ActionSelectionPopup from './ActionSelectionPopup.vue'
import { Game } from '@/game/Game'

const directionToRotation: Record<Direction, number> = {
  [Direction.E]: 0,
  [Direction.N]: -Math.PI / 2,
  [Direction.W]: Math.PI,
  [Direction.S]: Math.PI / 2,
  [Direction.X]: 0,
}

const CELL_SIZE = 48

export default defineComponent({
  components: {
    ActionSelectionPopup,
  },
  props: {
    state: {
      type: State,
      required: true,
    },
    game: {
      type: Game,
      required: true,
    },
    playerId: {
      type: Number,
      required: true,
    },
    registredActionsPerRoot: {
      type: Object as PropType<Record<number, string>>,
      required: true,
    },
    addActionToRoot: {
      type: Function as PropType<(action: string, rootId: number) => void>,
      required: true,
    },
    removeActionFromRoot: {
      type: Function as PropType<(rootId: number) => void>,
      required: true,
    },
  },
  data() {
    return {
      canvas: null as HTMLCanvasElement | null,
      ctx: null as CanvasRenderingContext2D | null,
      myImages: {} as Record<EntityType, HTMLImageElement>,
      oppImages: {} as Record<EntityType, HTMLImageElement>,
      popupVisible: false,
      popupX: 0,
      popupY: 0,
      selectedRoot: null as Entity | null,
      backgroundImage: null as HTMLImageElement | null,
    }
  },
  async mounted() {
    this.canvas = this.$refs.gameCanvas as HTMLCanvasElement
    this.ctx = this.canvas.getContext('2d')

    // Load background image
    this.backgroundImage = await createImage('background.jpg')

    await this.loadImages()
    this.drawGrid()
    this.setupMouseEvents()
  },
  watch: {
    state: {
      handler: 'drawGrid',
      deep: true,
      immediate: true,
    },
    registredActionsPerRoot: {
      handler: 'drawGrid',
      deep: true,
    },
  },
  methods: {
    async loadImages() {
      const imageUrls: Record<EntityType, string> = {
        EMPTY: 'wall.png',
        WALL: 'wall.png',
        ROOT: '0_root.png',
        BASIC: '0_basic.png',
        HARVESTER: '0_harvester.png',
        TENTACLE: '0_tentacle.png',
        SPORER: '0_sporer.png',
        A: 'a.png',
        B: 'b.png',
        C: 'c.png',
        D: 'd.png',
      }

      // Load my images
      for (const [key, url] of Object.entries(imageUrls)) {
        this.myImages[key as unknown as EntityType] = await createImage(url)
      }

      // Load opponent images
      const oppImageUrls = { ...imageUrls }
      for (const type of OrganTypes) {
        oppImageUrls[type] = oppImageUrls[type].replace('0_', '1_')
      }

      for (const [key, url] of Object.entries(oppImageUrls)) {
        this.oppImages[key as unknown as EntityType] = await createImage(url)
      }
    },
    drawGrid() {
      if (!this.ctx || !this.canvas) return

      this.canvas.width = this.state.width * CELL_SIZE
      this.canvas.height = this.state.height * CELL_SIZE

      const ctx = this.ctx
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

      // Draw background image
      if (this.backgroundImage) {
        ctx.globalAlpha = 1.0 // Adjust opacity if needed
        ctx.drawImage(this.backgroundImage, 0, 0, this.canvas.width, this.canvas.height)
        ctx.globalAlpha = 1.0
      }

      // Draw base grid
      for (let row = 0; row < this.state.height; row++) {
        for (let col = 0; col < this.state.width; col++) {
          const x = col * CELL_SIZE
          const y = row * CELL_SIZE

          // Draw cell border
          ctx.strokeStyle = 'black'
          ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE)
        }
      }

      // Draw clickable cells highlights
      this.drawClickableCells()

      // Draw entities
      for (const entity of this.state.entities) {
        this.drawEntity(entity)
      }

      this.drawRegisteredActions()
    },
    drawEntity(entity: Entity, opacity = 1.0) {
      if (!this.ctx) return

      const x = entity.x * CELL_SIZE
      const y = entity.y * CELL_SIZE
      const img =
        entity.owner === Owner.ONE ? this.myImages[entity.type] : this.oppImages[entity.type]
      const rotation = directionToRotation[entity.organDir]

      if (img) {
        this.ctx.save()
        this.ctx.globalAlpha = opacity // Adjust opacity if needed
        this.ctx.translate(x + CELL_SIZE / 2, y + CELL_SIZE / 2)
        if (rotation !== 0) {
          this.ctx.rotate(rotation)
        }
        this.ctx.drawImage(img, -CELL_SIZE / 2, -CELL_SIZE / 2, CELL_SIZE, CELL_SIZE)
        this.ctx.restore()
      }
    },
    drawClickableCells() {
      if (!this.ctx) return

      if (!this.selectedRoot) {
        // Highlight roots owned by the player
        this.state.entities
          .filter(
            (e) =>
              e.type === EntityType.ROOT &&
              e.owner === this.playerId &&
              !this.registredActionsPerRoot[e.organId],
          )
          .forEach((root) => {
            this.drawHighlight(root.x, root.y, 'rgba(0, 255, 0, 0.6)')
          })
      } else {
        // Highlight cells where the player can grow from selected root
        const growableCells = this.getGrowableCells(this.selectedRoot)
        growableCells.forEach(({ x, y }) => {
          this.drawHighlight(x, y, 'rgba(255, 255, 0, 0.2)')
        })
      }
    },

    drawHighlight(x: number, y: number, color: string) {
      if (!this.ctx) return
      this.ctx.fillStyle = color
      this.ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE)
    },

    drawRegisteredActions() {
      Object.values(this.registredActionsPerRoot).forEach((action) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [actionType, _parentOrganId, x, y, type, direction] = action.split(' ')
        const organType = (actionType === 'GROW' ? type : 'ROOT') as EntityType
        const entity = new Entity(
          Number(x),
          Number(y),
          organType,
          this.playerId,
          -1,
          direction as Direction,
          -1,
          -1,
        )
        console.log(entity)
        this.drawEntity(entity, 0.5)
      })
    },

    getGrowableCells(root: Entity): Array<{ x: number; y: number }> {
      const cells: Array<{ x: number; y: number }> = []

      const organs = this.state.entities.filter(
        (e) =>
          e.owner === this.playerId &&
          (e.organId === root.organId || e.organRootId === root.organId),
      )

      const directions = [
        { dx: 0, dy: -1 },
        { dx: 1, dy: 0 },
        { dx: 0, dy: 1 },
        { dx: -1, dy: 0 },
      ]

      organs.forEach((organ) => {
        const { x, y } = organ
        directions.forEach(({ dx, dy }) => {
          const nx = x + dx
          const ny = y + dy

          if (nx >= 0 && nx < this.state.width && ny >= 0 && ny < this.state.height) {
            const entity = this.state.getEntityAt({ x: nx, y: ny })
            if (
              [EntityType.EMPTY, ...ProteinTypes].includes(entity.type) &&
              this.state.canGrowHere({ x: nx, y: ny }, this.playerId)
            ) {
              cells.push({ x: nx, y: ny })
            }
          }
        })
      })

      const sporers = organs.filter((o) => o.type === EntityType.SPORER)
      sporers.forEach((sporer) => {
        const { x, y } = sporer
        const [dx, dy] = getDxDyFromDirection(sporer.organDir)
        let nx = x + dx
        let ny = y + dy
        while (nx >= 0 && nx < this.state.width && ny >= 0 && ny < this.state.height) {
          const entity = this.state.getEntityAt({ x: nx, y: ny })
          if ([EntityType.EMPTY, ...ProteinTypes].includes(entity.type)) {
            cells.push({ x: nx, y: ny })
            nx += dx
            ny += dy
            continue
          }
          break
        }
      })

      return cells.filter((c, idx) => cells.findIndex((c1) => c1.x === c.x && c1.y === c.y) === idx)
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
                organParentId: entity.organParentId,
              })
            : `${col},${row}`

          const infoDisplay = document.getElementById('infoDisplay')
          if (infoDisplay) {
            infoDisplay.textContent = info
          }
        }
      })
    },

    handleCanvasClick(event: MouseEvent) {
      const { waitingForActions } = this.game
      if (!waitingForActions[this.playerId as 0 | 1]) {
        return
      }

      const rect = this.canvas!.getBoundingClientRect()
      const mouseX = event.clientX - rect.left
      const mouseY = event.clientY - rect.top

      const col = Math.floor(mouseX / CELL_SIZE)
      const row = Math.floor(mouseY / CELL_SIZE)

      if (col < 0 || col >= this.state.width || row < 0 || row >= this.state.height) {
        return
      }

      const entity = this.state.getEntityAt({ x: col, y: row })

      // Checking if we click to remove an action
      for (const [rootId, action] of Object.entries(this.registredActionsPerRoot)) {
        const [, , x, y] = action.split(' ')
        if (Number(x) === col && Number(y) === row) {
          this.removeActionFromRoot(Number(rootId))
          return
        }
      }

      // If clicking on a root owned by the player
      if (
        entity.type === EntityType.ROOT &&
        entity.owner === this.playerId &&
        !this.registredActionsPerRoot[entity.organId]
      ) {
        this.selectedRoot = entity
        this.drawGrid()
        return
      }

      // If a root is selected and clicking on a growable cell
      if (
        this.selectedRoot &&
        this.getGrowableCells(this.selectedRoot).some((cell) => cell.x === col && cell.y === row)
      ) {
        this.popupX = col
        this.popupY = row
        this.popupVisible = true
      } else if (this.selectedRoot) {
        this.selectedRoot = null
        this.popupVisible = false
        this.drawGrid()
      }
    },

    findParent(x: number, y: number): Entity | null {
      const neighours = this.state
        .getNeighboursButWall({ x, y })
        .map((n) => this.state.getEntityAt(n))
      const parent = neighours.find((n) => {
        return n && n.owner === this.playerId
      })

      return parent ? parent : null
    },

    findSporerParent(x: number, y: number): Entity | null {
      let canSpore = false
      let entity = this.state.getEntityAt({ x, y })
      for (const [dx, dy] of AllDxDy) {
        let nx = x + dx
        let ny = y + dy
        while (nx >= 0 && nx < this.state.width && ny >= 0 && ny < this.state.height) {
          entity = this.state.getEntityAt({ x: nx, y: ny })
          if ([EntityType.EMPTY, ...ProteinTypes].includes(entity.type)) {
            nx += dx
            ny += dy
            continue
          }

          if (
            entity.type === EntityType.SPORER &&
            entity.owner === this.playerId &&
            entity.organDir === getDirection({ x: nx, y: ny }, { x: nx - dx, y: ny - dy })
          ) {
            canSpore = true
            break
          }
          nx += dx
          ny += dy
        }
        if (canSpore) {
          break
        }
      }
      console.log('canSpore', canSpore, entity)
      if (canSpore) {
        return entity
      }
      return null
    },
    closePopup() {
      this.popupVisible = false
    },
    addAction(organ: OrganType, direction: Direction) {
      this.selectedRoot = null
      if (organ === EntityType.ROOT) {
        const sporerParent = this.findSporerParent(this.popupX, this.popupY)
        if (!sporerParent) {
          return
        }
        const action = `SPORE ${sporerParent.organId} ${this.popupX} ${this.popupY}`

        this.addActionToRoot(action, sporerParent.organRootId)
        return
      }

      const parent = this.findParent(this.popupX, this.popupY)
      if (!parent) {
        return
      }

      const action = `GROW ${parent.organId} ${this.popupX} ${this.popupY} ${organ} ${direction}`

      const rootId = parent.type === EntityType.ROOT ? parent.organId : parent.organRootId
      this.addActionToRoot(action, rootId)
    },
  },
})
</script>

<style scoped>
canvas {
  border: 1px solid black;
  display: block;
  margin: 20px auto;
}
</style>
