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
    <div class="action-input">
      <textarea
        v-model="actionText"
        placeholder="Enter actions (one per line)&#10;Example: GROW 3 5 2 BASIC X"
        rows="5"
        cols="50"
      ></textarea>
      <button @click="processActions">Apply Actions</button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { Direction, EntityType, Owner } from '@/game/Entity'
import { OrganTypes, State, type OrganType } from '@/game/State'
import { createImage } from '@/utils/imageLoader'
import {
  type Action,
  actionFirestoreConvertor,
  GrowAction,
  SporeAction,
  WaitAction,
} from '@/game/Actions'
import { useCollection, useDocument, useFirestore } from 'vuefire'
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  updateDoc,
} from 'firebase/firestore'
import { firebaseApp } from '@/infra/firebase'
import { Game, gameFirestoreConvertor } from '@/game/Game'

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
    const db = getFirestore(firebaseApp)
    const gameId = this.$route.params.gameId as string
    const playerUuid = this.$route.params.playerUuid as string

    const gameRef = doc(db, 'games', gameId).withConverter(gameFirestoreConvertor)
    const game = useDocument<Game>(gameRef)

    const playerId = game.data.value?.playerIds[playerUuid] ?? Owner.ONE
    console.log(game.data.value, gameId)
    console.log(playerId, playerUuid)

    const actionsRef = collection(db, 'games', gameId, 'actions').withConverter(
      actionFirestoreConvertor,
    )
    const actions = useCollection<GrowAction | SporeAction | WaitAction>(actionsRef)

    return {
      initialized: false,
      mapName: '-109498249532328380',
      gameRef,
      game,
      gameId: this.$route.params.gameId as string,
      playerUuid,
      playerId: Owner.ONE as Owner.ONE | Owner.TWO,
      state: new State(),
      isPaused: true,
      canvas: null as HTMLCanvasElement | null,
      ctx: null as CanvasRenderingContext2D | null,
      myImages: {} as Record<EntityType, HTMLImageElement>,
      oppImages: {} as Record<EntityType, HTMLImageElement>,
      actionText: '',
      lastProcessedActionId: null as string | null,
      actions,
      previousActions: [...actions.data.value],
    }
  },
  async mounted() {
    this.canvas = this.$refs.gameCanvas as HTMLCanvasElement
    this.ctx = this.canvas.getContext('2d')

    const db = useFirestore()

    const gameDoc = await getDoc(
      doc(db, 'games', this.gameId).withConverter(gameFirestoreConvertor),
    )
    if (!gameDoc.exists()) {
      throw new Error('The game does not exists')
    }

    this.playerId = gameDoc.data().playerIds[this.playerUuid]

    await this.loadImages()
    await this.initializeGame()

    this.setupMouseEvents()
    this.drawGrid()
    this.updateProteinsDisplay()

    const actionCollection = collection(db, 'games', this.gameId, 'actions').withConverter(
      actionFirestoreConvertor,
    )
    const actionDocs = await getDocs(actionCollection)
    const actions = actionDocs.docs.map((d) => d.data())
    this.handleNewActions(actions)
    this.previousActions = actions

    this.initialized = true
  },
  watch: {
    game: function (newGame: Game) {
      console.log('Game changed', newGame)
      if (this.playerId !== Owner.ONE) return
    },
    actions: {
      deep: true,
      immediate: false,
      handler(newActions: Action[]) {
        if (!this.initialized) return

        const actionsNotProcessed = newActions
          .filter((action) => this.previousActions.findIndex((a) => a.id === action.id) === -1)
          .sort((a, b) => a.turn - b.turn)
        console.log(newActions, this.previousActions, actionsNotProcessed)
        this.previousActions = [...this.actions]

        this.handleNewActions(actionsNotProcessed)
      },
    },
  },
  methods: {
    async initializeGame() {
      const inputs = await this.loadMap(this.mapName)
      this.state.setMapSize(inputs.shift()!)
      this.state.refreshState(inputs)
      this.state.refreshProteins()

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
          entity.owner === Owner.ONE ? this.myImages[entity.type] : this.oppImages[entity.type]
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
    updateProteinsDisplay(): void {
      const { proteinsPerPlayer, proteinGainsPerPlayer } = this.state
      const proteinsDisplay = document.getElementById('proteinsDisplay')
      const proteinsForPlayer = proteinsPerPlayer[this.playerId]
      if (proteinsDisplay) {
        proteinsDisplay.textContent = `Proteins: A: ${proteinsForPlayer.A}, B: ${proteinsForPlayer.B}, C: ${proteinsForPlayer.C}, D: ${proteinsForPlayer.D}`
      }

      const proteinsGainsDisplay = document.getElementById('proteinsGainsDisplay')
      const proteinGainsForPlayer = proteinGainsPerPlayer[this.playerId]
      if (proteinsGainsDisplay) {
        proteinsGainsDisplay.textContent = `Proteins: A: ${proteinGainsForPlayer.A}, B: ${proteinGainsForPlayer.B}, C: ${proteinGainsForPlayer.C}, D: ${proteinGainsForPlayer.D}`
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
        return content.split('\n')
      } catch (error) {
        console.error('Error loading map:', error)
        throw error
      }
    },
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
    processActions() {
      const actions = this.actionText.split('\n').filter((line) => line.trim())

      for (const actionLine of actions) {
        const [actionType, organId, x, y, type, direction] = actionLine.split(' ')
        let action: Action = new WaitAction(this.playerId, this.state.turn)
        if (actionType === 'GROW') {
          action = new GrowAction(
            this.playerId,
            this.state.turn,
            Number(organId),
            { x: Number(x), y: Number(y) },
            type as OrganType,
            direction as Direction,
          )
        } else if (actionType === 'SPORE') {
          action = new SporeAction(this.playerId, this.state.turn, Number(organId), {
            x: Number(x),
            y: Number(y),
          })
        }

        const collectionRef = collection(
          useFirestore(),
          'games',
          this.gameId,
          'actions',
        ).withConverter(actionFirestoreConvertor)
        addDoc(collectionRef, action)

        const waitingForActionsField = `waitingForActions.${this.playerId}`

        updateDoc(this.gameRef, {
          [waitingForActionsField]: false,
        })
      }
    },
    handleNewActions(actions: Action[]) {
      for (const action of actions) {
        console.log('Processing action:', action)
        try {
          this.state.applyAction(action)
          this.state.updateStateFromActions()
          this.updateProteinsDisplay()
          this.drawGrid()
          this.state.turn = action.turn + 1
          this.lastProcessedActionId = action.id
        } catch (error) {
          console.error(`Error processing action:`, error)
        }
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
.action-input {
  margin: 20px auto;
  text-align: center;
}
.action-input textarea {
  display: block;
  margin: 10px auto;
  padding: 10px;
  font-family: monospace;
}
</style>
