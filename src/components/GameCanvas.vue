<template>
  <canvas ref="gameCanvas" @click="handleCanvasClick"></canvas>
  <ActionSelectionPopup
    :visible="popupVisible"
    :playerId="playerId"
    :temporaryProteins="temporaryProteins"
    :x="popupX"
    :y="popupY"
    :onClose="closePopup"
    :onSelect="addAction"
  />
</template>

<script lang="ts">
import { Direction, Entity, EntityType, Owner, ProteinTypes } from '@/game/Entity'
import { AllDxDy, getDirection } from '@/game/helpers'
import { OrganTypes, State, type OrganType, type ProteinType } from '@/game/State'
import { createImage } from '@/utils/imageLoader'
import { defineComponent, type PropType } from 'vue'
import ActionSelectionPopup from './ActionSelectionPopup.vue'
import { Game } from '@/game/Game'
import { GrowAction, SporeAction } from '@/game/Actions'
import { logEvent } from 'firebase/analytics'
import { firebaseAnalytics } from '@/infra/firebase'
import { useResponsiveGrid } from '@/composables/useResponsiveGrid'

const directionToRotation: Record<Direction, number> = {
  [Direction.E]: 0,
  [Direction.N]: -Math.PI / 2,
  [Direction.W]: Math.PI,
  [Direction.S]: Math.PI / 2,
  [Direction.X]: 0,
}

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
    temporaryProteins: {
      type: Object as PropType<Record<ProteinType, number>>,
      required: true,
    },
    registredActionsPerRoot: {
      type: Object as PropType<Record<number, GrowAction | SporeAction>>,
      required: true,
    },
    addActionToRoot: {
      type: Function as PropType<(action: GrowAction | SporeAction, rootId: number) => void>,
      required: true,
    },
    removeActionFromRoot: {
      type: Function as PropType<(rootId: number) => void>,
      required: true,
    },
  },
  setup(props) {
    const { cellSize, canvasWidth, canvasHeight } = useResponsiveGrid(
      props.state.width,
      props.state.height,
    )

    return {
      cellSize,
      canvasWidth,
      canvasHeight,
    }
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

    window.addEventListener('resize', this.drawGrid)
  },
  unmounted() {
    window.removeEventListener('resize', this.drawGrid)
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
    playerId: 'drawGrid',
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

      console.log('Drawing grid', this.canvasWidth, this.canvasHeight)

      this.canvas.width = this.canvasWidth
      this.canvas.height = this.canvasHeight

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
          const x = col * this.cellSize
          const y = row * this.cellSize

          // Draw cell border
          ctx.strokeStyle = 'black'
          ctx.strokeRect(x, y, this.cellSize, this.cellSize)
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

      const x = entity.x * this.cellSize
      const y = entity.y * this.cellSize
      const img =
        entity.owner === Owner.ONE ? this.myImages[entity.type] : this.oppImages[entity.type]
      const rotation = directionToRotation[entity.organDir]

      if (img) {
        this.ctx.save()
        this.ctx.globalAlpha = opacity // Adjust opacity if needed
        this.ctx.translate(x + this.cellSize / 2, y + this.cellSize / 2)
        if (rotation !== 0) {
          this.ctx.rotate(rotation)
        }
        this.ctx.drawImage(
          img,
          -this.cellSize / 2,
          -this.cellSize / 2,
          this.cellSize,
          this.cellSize,
        )
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
        const growableCells = this.state.getGrowableCells(this.selectedRoot, this.playerId)
        growableCells.forEach(({ x, y }) => {
          this.drawHighlight(x, y, 'rgba(255, 255, 0, 0.2)')
        })

        // Highlight cell clicked for action
        if (this.popupX && this.popupY) {
          const color =
            this.playerId === Owner.ONE ? 'rgba(0, 0, 255, 0.9)' : 'rgba(255, 0, 0, 0.9)'
          this.drawHighlight(this.popupX, this.popupY, color)
        }
      }
    },

    drawHighlight(x: number, y: number, color: string) {
      if (!this.ctx) return
      this.ctx.fillStyle = color
      this.ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize)
    },

    drawRegisteredActions() {
      Object.values(this.registredActionsPerRoot)
        .filter((a) => a.playerId === this.playerId)
        .forEach((action) => {
          const {
            actionType,
            target: { x, y },
            type,
            direction,
          } = action
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

    setupMouseEvents() {
      if (!this.canvas) return

      this.canvas.addEventListener('mousemove', (event) => {
        const rect = this.canvas!.getBoundingClientRect()
        const scale = this.canvas!.width / rect.width // Calcul du ratio d'échelle

        // Appliquer le ratio d'échelle aux coordonnées de la souris
        const mouseX = (event.clientX - rect.left) * scale
        const mouseY = (event.clientY - rect.top) * scale

        const col = Math.floor(mouseX / this.cellSize)
        const row = Math.floor(mouseY / this.cellSize)

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
      logEvent(firebaseAnalytics, 'click_canvas')
      const { waitingForActions } = this.game
      if (!waitingForActions[this.playerId as 0 | 1]) {
        return
      }

      const rect = this.canvas!.getBoundingClientRect()
      // const scale = this.canvas!.width / rect.width // Calcul du ratio d'échelle

      // Appliquer le ratio d'échelle aux coordonnées de la souris
      const mouseX = event.clientX - rect.left
      const mouseY = event.clientY - rect.top

      const col = Math.floor(mouseX / this.cellSize)
      const row = Math.floor(mouseY / this.cellSize)

      console.log(col, row, mouseX, mouseY)

      if (col < 0 || col >= this.state.width || row < 0 || row >= this.state.height) {
        return
      }

      const entity = this.state.getEntityAt({ x: col, y: row })
      console.log(entity)

      // Checking if we click to remove an action
      for (const [rootId, action] of Object.entries(this.registredActionsPerRoot)) {
        const {
          target: { x, y },
        } = action
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
        this.state
          .getGrowableCells(this.selectedRoot, this.playerId)
          .some((cell) => cell.x === col && cell.y === row)
      ) {
        this.popupX = col
        this.popupY = row
        this.popupVisible = true
        this.drawGrid()
      } else if (this.selectedRoot) {
        this.selectedRoot = null
        this.popupX = -1
        this.popupY = -1
        this.popupVisible = false
        this.drawGrid()
      }
    },

    findParent(x: number, y: number, selectedRoot: Entity): Entity | null {
      const neighours = this.state
        .getNeighboursButWall({ x, y })
        .map((n) => this.state.getEntityAt(n))
      const parent = neighours.find((n) => {
        return (
          n &&
          n.owner === this.playerId &&
          (n.organRootId === selectedRoot.organId || n.organId === selectedRoot.organId)
        )
      })

      return parent ? parent : null
    },

    findSporerParent(x: number, y: number, selectedRoot: Entity): Entity | null {
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
            entity.organRootId === selectedRoot.organId &&
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
      this.popupX = -1
      this.popupY = -1
      this.drawGrid()
    },
    addAction(organ: OrganType, direction: Direction) {
      if (!this.selectedRoot) {
        return
      }

      if (organ === EntityType.ROOT) {
        const sporerParent = this.findSporerParent(this.popupX, this.popupY, this.selectedRoot)
        this.selectedRoot = null
        if (!sporerParent) {
          return
        }
        const action = new SporeAction(this.playerId, this.state.turn, sporerParent.organId, {
          x: this.popupX,
          y: this.popupY,
        })

        this.addActionToRoot(action, sporerParent.organRootId)
        return
      }

      const parent = this.findParent(this.popupX, this.popupY, this.selectedRoot)
      this.selectedRoot = null
      this.popupX = -1
      this.popupY = -1
      if (!parent) {
        return
      }

      const action = new GrowAction(
        this.playerId,
        this.state.turn,
        parent.organId,
        { x: this.popupX, y: this.popupY },
        organ,
        direction,
      )

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
  margin: auto;
}
</style>
