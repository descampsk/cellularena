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
import { Direction, Entity, EntityType, OrganTypes, Owner } from '@/game/Entity'
import { State, type OrganType, type ProteinType } from '@/game/State'
import { createImage } from '@/utils/imageLoader'
import { defineComponent, type PropType } from 'vue'
import ActionSelectionPopup from './ActionSelectionPopup.vue'
import { Game } from '@/game/Game'
import { GrowAction, SporeAction } from '@/game/Actions'
import { logEvent } from 'firebase/analytics'
import { firebaseAnalytics } from '@/infra/firebase'
import { useResponsiveGrid } from '@/composables/useResponsiveGrid'
import { SpriteService } from '@/utils/SpriteService'

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
    isAnimating: {
      type: Boolean,
      required: true,
    },
  },
  emits: ['update:isAnimating'],
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
      images: {} as Record<EntityType, HTMLImageElement>,
      spritesPerPlayer: {
        [Owner.ONE]: new SpriteService(),
        [Owner.TWO]: new SpriteService(),
      },
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

    // Load spritesheets instead of individual images
    await Promise.all([
      this.spritesPerPlayer[0].loadSpritesheet('0.png', '0.json'),
      this.spritesPerPlayer[1].loadSpritesheet('1.png', '1.json'),
    ])

    this.drawGrid()
    this.setupMouseEvents()

    window.addEventListener('resize', () => this.drawGrid())
  },
  unmounted() {
    window.removeEventListener('resize', () => this.drawGrid())
  },
  watch: {
    isAnimating: function () {
      if (this.isAnimating) {
        this.startAnimation()
      }
    },
    registredActionsPerRoot: {
      handler: function () {
        this.drawGrid()
      },
      deep: true,
    },
    playerId: function () {
      this.drawGrid()
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
        this.images[key as unknown as EntityType] = await createImage(url)
      }
    },
    drawGrid() {
      if (!this.ctx || !this.canvas) return

      this.canvas.width = this.canvasWidth
      this.canvas.height = this.canvasHeight

      // Draw background and grid
      this.drawBackground()
      this.drawGridLines()
      this.drawClickableCells()

      // Draw game elements
      this.drawAllEntities()
      this.drawConnectors()
      this.drawRegisteredActions()
    },

    drawBackground() {
      if (!this.ctx || !this.backgroundImage) return
      this.ctx.globalAlpha = 1.0
      this.ctx.drawImage(this.backgroundImage, 0, 0, this.canvas!.width, this.canvas!.height)
    },

    drawGridLines() {
      if (!this.ctx) return
      for (let row = 0; row < this.state.height; row++) {
        for (let col = 0; col < this.state.width; col++) {
          const x = col * this.cellSize
          const y = row * this.cellSize
          this.ctx.strokeStyle = 'black'
          this.ctx.strokeRect(x, y, this.cellSize, this.cellSize)
        }
      }
    },

    drawAllEntities(frameIndex = 0) {
      let hasAnimatingEntities = false

      // First draw non-animated entities
      this.state.entities
        .filter((e) => !e.shouldBeAnimated && !e.isGrowing)
        .forEach((entity) => {
          this.drawEntity(entity, 1.0)
        })

      // Then draw animated entities
      this.state.entities
        .filter((e) => e.shouldBeAnimated)
        .forEach((entity) => {
          const isStillAnimating = this.drawEntity(entity, 1.0, frameIndex)
          hasAnimatingEntities = hasAnimatingEntities || isStillAnimating
        })

      return hasAnimatingEntities
    },

    startAnimation() {
      let frameIndex = 0
      let lastFrameTime = 0
      const FRAME_INTERVAL = 30 // Increased from default ~16ms to 30ms for slower animation

      const animate = (timestamp: number) => {
        // Only update if enough time has passed
        if (timestamp - lastFrameTime >= FRAME_INTERVAL) {
          this.clearEntitiesLayer()
          this.drawBackground()
          this.drawGridLines()
          this.drawClickableCells()

          const shouldContinue = this.drawAllEntities(frameIndex++)

          this.drawConnectors()
          this.drawRegisteredActions()

          lastFrameTime = timestamp

          if (shouldContinue) {
            this.$emit('update:isAnimating', true)
          } else {
            this.$emit('update:isAnimating', false)
            return
          }
        }

        requestAnimationFrame(animate)
      }

      requestAnimationFrame(animate)
    },

    clearEntitiesLayer() {
      if (!this.ctx || !this.canvas) return
      // Clear only the necessary parts where entities are
      this.state.entities
        .filter((e) => e.shouldBeAnimated)
        .forEach((entity) => {
          const x = entity.x * this.cellSize
          const y = entity.y * this.cellSize
          this.ctx!.clearRect(
            x - this.cellSize / 2,
            y - this.cellSize / 2,
            this.cellSize * 2,
            this.cellSize * 2,
          )
        })
    },

    drawEntity(entity: Entity, opacity = 1.0, frameCount = 0) {
      if (!this.ctx) return false

      let shouldContinueAnimating = false

      const x = entity.x * this.cellSize
      const y = entity.y * this.cellSize
      if (OrganTypes.includes(entity.type) && entity.owner !== Owner.NONE) {
        const spriteService = this.spritesPerPlayer[entity.owner]
        const isAnimating = spriteService.drawOrgan(
          this.ctx,
          entity,
          this.cellSize,
          opacity,
          frameCount,
        )
        if (!shouldContinueAnimating && isAnimating) {
          shouldContinueAnimating = true
        }
      } else if (entity.oldEntity?.isDying) {
        console.log('Drawing dying entity', entity)
        const spriteService = this.spritesPerPlayer[entity.oldEntity.owner as Owner.ONE | Owner.TWO]
        const isAnimating = spriteService.drawOrgan(
          this.ctx,
          entity.oldEntity,
          this.cellSize,
          opacity,
          frameCount,
        )
        if (!shouldContinueAnimating && isAnimating) {
          shouldContinueAnimating = true
        }
      } else if (entity.type !== EntityType.EMPTY) {
        const image = this.images[entity.type]
        if (image) {
          this.ctx.save()
          this.ctx.globalAlpha = opacity // Adjust opacity if needed
          this.ctx.translate(x, y)
          this.ctx.drawImage(image, 0, 0, this.cellSize, this.cellSize)
          this.ctx.restore()
        }
      }

      return shouldContinueAnimating
    },
    drawConnectors() {
      if (!this.ctx) return

      this.state.entities
        .filter((e) => e.owner !== Owner.NONE)
        .forEach((organ) => {
          const { x, y } = organ
          const neighbours = this.state.getNeighboursButWall({ x, y })
          neighbours.forEach(({ x: nx, y: ny }) => {
            const entity = this.state.getEntityAt({ x: nx, y: ny })
            if (entity && entity.owner === organ.owner && entity.organParentId === organ.organId) {
              const spriteService = this.spritesPerPlayer[organ.owner as Owner.ONE | Owner.TWO]
              if (spriteService) {
                spriteService.drawConnector(this.ctx!, organ, entity, this.cellSize)
              }
            }
          })
        })
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
          entity.shouldBeAnimated = false
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

      if (col < 0 || col >= this.state.width || row < 0 || row >= this.state.height) {
        return
      }

      const entity = this.state.getEntityAt({ x: col, y: row })

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
        const sporerParent = this.state.findSporerParent(
          this.popupX,
          this.popupY,
          this.selectedRoot,
          this.playerId,
        )
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

      const parent = this.state.findParent(
        this.popupX,
        this.popupY,
        this.selectedRoot,
        this.playerId,
      )
      this.selectedRoot = null
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
      this.popupX = -1
      this.popupY = -1
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
