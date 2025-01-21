<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="game-layout">
    <!-- Add give up dialog -->
    <GiveUpDialog
      :show="showGiveUpDialog"
      @close="showGiveUpDialog = false"
      @confirm="handleGiveUp"
    />

    <!-- Add winner dialog -->
    <WinnerDialog
      v-if="game && winner !== null && winReason !== null"
      :show="winner !== null"
      :scorePerPlayer="scorePerPlayer"
      :winner="winner"
      :winReason="winReason"
      :game="game"
      :playerId="playerId"
    />

    <!-- Add rotation overlay -->
    <div v-if="needsRotation" class="rotation-overlay">
      <div class="rotation-content">
        <div class="rotate-icon">⟳</div>
        <p>Please rotate your device to landscape mode</p>
      </div>
    </div>

    <div class="game-area">
      <div class="top-section">
        <div v-if="game" class="players-container">
          <div class="left-player">
            <PlayerInfo
              :state="state"
              :temporaryProteins="temporaryProteinsPerPlayer[Owner.ONE]"
              :playerId="Owner.ONE"
              :isActive="playerId === Owner.ONE"
              :game="game"
            />
          </div>
          <div class="center-controls">
            <TurnIndicator :turn="state.turn" />
            <button v-if="game.mode === 'versus'" @click="copyShareLink" class="share-button">
              {{ copyStatus }}
            </button>
          </div>
          <div class="right-player">
            <PlayerInfo
              :state="state"
              :temporaryProteins="temporaryProteinsPerPlayer[Owner.TWO]"
              :playerId="Owner.TWO"
              :isActive="playerId === Owner.TWO"
              :game="game"
            />
          </div>
        </div>
        <!-- <div id="infoDisplay" class="info-display">Hover over a cell to see its details</div> -->
      </div>

      <div v-if="game && initialized" class="main-section">
        <div class="canvas-wrapper">
          <GameCanvas
            ref="gameCanvas"
            :state="state"
            :game="game"
            :playerId="playerId"
            :temporaryProteins="temporaryProteinsPerPlayer[playerId]"
            :registredActionsPerRoot="registredActionsPerRoot"
            :addActionToRoot="addActionToRoot"
            :removeActionFromRoot="removeActionFromRoot"
            v-model:is-animating="isCanvasAnimating"
          />
        </div>
      </div>
      <div v-if="!isReplay" class="action-buttons">
        <button class="give-up-button" @click="showGiveUpDialog = true">Give Up</button>
        <button
          class="share-button"
          v-if="canSubmitActions"
          @click="processActions"
          :disabled="isProcessing"
        >
          <span v-if="isProcessing" class="loading-spinner">⟳</span>
          {{ isProcessing ? 'Processing...' : 'Apply Actions' }}
        </button>
        <button class="share-button" v-else disabled>Waiting for the other player</button>
      </div>
      <div v-else class="action-buttons">
        <button class="share-button" @click="replayRefresh">Refresh</button>
        <button class="share-button" :disabled="isCanvasAnimating" @click="replayNextTurn">
          Next Turn
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { Direction, Owner, ProteinTypes } from '@/game/Entity'
import { ProteinsPerOrgan, State, type OrganType, type ProteinType } from '@/game/State'
import { actionFirestoreConvertor, GrowAction, SporeAction, WaitAction } from '@/game/Actions'
import { useDocument, useFirestore } from 'vuefire'
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  updateDoc,
} from 'firebase/firestore'
import { firebaseAnalytics, firebaseApp } from '@/infra/firebase'
import { Game, gameFirestoreConvertor } from '@/game/Game'
import PlayerInfo from '@/components/PlayerInfo.vue'
import GameCanvas from '@/components/GameCanvas.vue'
import { logEvent } from 'firebase/analytics'
import type { Bot } from '@/bots/bots'
import { EndGameChecker } from '@/game/EndGameChecker'
import WinnerDialog from '@/components/WinnerDialog.vue'
import GiveUpDialog from '@/components/GiveUpDialog.vue'
import TurnIndicator from '@/components/TurnIndicator.vue'
import { sleep } from '@/utils/common'

export default defineComponent({
  components: {
    PlayerInfo,
    GameCanvas,
    WinnerDialog,
    GiveUpDialog,
    TurnIndicator,
  },
  data() {
    const db = getFirestore(firebaseApp)
    const gameId = this.$route.params.gameId as string
    const playerUuid = this.$route.params.playerUuid as string
    const isReplay = this.$route.name === 'replay'

    const gameRef = doc(db, 'games', gameId).withConverter(gameFirestoreConvertor)
    const game = useDocument<Game>(gameRef)

    const actionsRef = collection(db, 'games', gameId, 'actions').withConverter(
      actionFirestoreConvertor,
    )

    const state = new State()

    return {
      initialized: false,
      isReplay,
      gameRef,
      game,
      gameId: this.$route.params.gameId as string,
      actionsRef,
      playerUuid,
      playerId: Owner.ONE as Owner.ONE | Owner.TWO,
      state,
      endGameChecker: new EndGameChecker(state),
      bot: null as Bot | null,
      isPaused: true,
      actionText: '',
      registredActionsPerRoot: {} as Record<number, GrowAction | SporeAction>,
      Owner, // Add Owner enum to template
      copyStatus: 'Share Link',
      needsRotation: false,
      isProcessing: false,
      winner: null as Owner | null,
      winReason: null as string | null,
      showGiveUpDialog: false,
      isCanvasAnimating: false,
    }
  },
  computed: {
    canSubmitActions(): boolean {
      if (!this.game) return false
      return this.game.waitingForActions[this.playerId]
    },
    waitingMessage(): string {
      const waitingPlayer = this.playerId === Owner.ONE ? 'Player Two' : 'Player One'
      return `Waiting for ${waitingPlayer} to play...`
    },
    temporaryProteinsPerPlayer(): {
      [Owner.ONE]: Record<ProteinType, number>
      [Owner.TWO]: Record<ProteinType, number>
    } {
      const tmpProteinsPerPlayer = {
        [Owner.ONE]: { ...this.state.proteinsPerPlayer[Owner.ONE] },
        [Owner.TWO]: { ...this.state.proteinsPerPlayer[Owner.TWO] },
      }
      for (const action of Object.values(this.registredActionsPerRoot)) {
        const { playerId, type } = action
        const cost = ProteinsPerOrgan[type as OrganType]
        for (const protein of ProteinTypes) {
          tmpProteinsPerPlayer[playerId][protein as ProteinType] -= cost[protein as ProteinType]
        }
      }

      return tmpProteinsPerPlayer
    },
    scorePerPlayer(): Record<Owner.ONE | Owner.TWO, number> {
      return this.endGameChecker.getScorePerPlayer()
    },
  },
  async mounted() {
    const db = useFirestore()

    const gameDoc = await getDoc(
      doc(db, 'games', this.gameId).withConverter(gameFirestoreConvertor),
    )
    if (!gameDoc.exists()) {
      throw new Error('The game does not exists')
    }

    const game = gameDoc.data()

    this.playerId = game.playerIds[this.playerUuid]

    await this.initializeGame(game.seed)
    this.state.cleanGrowingOrgans()

    const serializedState = this.getSerializedState()
    const isMapYSymmetrical = this.state.checkYSymmetry()

    if (!this.isReplay) {
      this.state.turn = game.turn
      await this.handleActions(false)
      if (game.mode === 'solo') {
        this.bot = (await this.loadBot('q6IXPuqRV1')) as Bot
      }
    } else {
      this.state.turn = 1
    }

    await this.handleEndGame()

    this.initialized = true

    await updateDoc(this.gameRef, {
      isMapYSymmetrical,
      serializedState,
      isInitialized: true,
    })

    console.log('Game initialized')

    this.checkOrientation()
    window.addEventListener('resize', this.checkOrientation)
  },
  unmounted() {
    window.removeEventListener('resize', this.checkOrientation)
  },
  watch: {
    game: async function (newGame: Game) {
      console.log('Game changed', newGame)
      const waitingForPlayerOne = newGame.waitingForActions[Owner.ONE]
      const waitingForPlayerTwo = newGame.waitingForActions[Owner.TWO]

      if (
        (this.playerId === Owner.ONE || newGame.mode === 'training') &&
        !waitingForPlayerOne &&
        !waitingForPlayerTwo
      ) {
        console.log('Both players have submitted actions')
        this.state.turn++

        await this.handleActions(true)

        const serializedState = this.getSerializedState()
        await updateDoc(this.gameRef, {
          turn: this.state.turn,
          serializedState,
          waitingForActions: {
            [Owner.ONE]: true,
            [Owner.TWO]: true,
          },
        })
        this.handleEndGame()
      } else if (this.playerId === Owner.TWO && this.state.turn + 1 === newGame.turn) {
        console.log('Both players have submitted actions')

        this.state.turn = newGame.turn

        await updateDoc(this.gameRef, {
          turn: this.state.turn,
          'waitingForActions.1': true,
        })

        await this.handleActions(true)
        await this.handleEndGame()
      }
    },
  },
  methods: {
    async initializeGame(seed: string) {
      const inputs = await this.loadMap(seed)
      console.log('Map loaded')
      this.state.setMapSize(inputs.shift()!)
      this.state.refreshState(inputs)
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
    removeActionFromRoot(root: number) {
      delete this.registredActionsPerRoot[root]
    },
    async processActions() {
      if (this.isProcessing) return

      try {
        this.isProcessing = true
        logEvent(firebaseAnalytics, 'apply_actions')
        const actions = Object.values(this.registredActionsPerRoot).filter(
          (a) => a.playerId === this.playerId,
        )

        for (const action of actions) {
          const collectionRef = collection(
            useFirestore(),
            'games',
            this.gameId,
            'actions',
          ).withConverter(actionFirestoreConvertor)
          await addDoc(collectionRef, action)
        }

        const waitingForActionsField = `waitingForActions.${this.playerId}`
        await updateDoc(this.gameRef, {
          [waitingForActionsField]: false,
        })

        if (this.game?.mode === 'solo' && this.game.botName !== 'reCurse') {
          await this.resolveAIActions()
        }

        if (this.game?.mode === 'training') {
          this.playerId = this.playerId === Owner.ONE ? Owner.TWO : Owner.ONE
        }
      } catch (error) {
        console.error('Error processing actions:', error)
      } finally {
        this.isProcessing = false
      }
    },
    async handleActions(onlyNew = true) {
      console.debug('Handling actions')
      const actionDocs = await getDocs(this.actionsRef)
      const newActions = actionDocs.docs
        .map((d) => d.data())
        .filter(
          (a) => !(a instanceof WaitAction) && (!onlyNew || a.turn === this.state.turn - 1),
        ) as (GrowAction | SporeAction)[]

      newActions.sort((a, b) => {
        const aTurn = a.turn
        const bTurn = b.turn
        if (aTurn != bTurn) return aTurn - bTurn

        if (a.playerId !== b.playerId) return a.playerId - b.playerId

        if (a.organId !== b.organId) return a.organId - b.organId

        return a.id.localeCompare(b.id)
      })
      const maxTurn = newActions.length > 0 ? newActions[newActions.length - 1].turn : 0

      for (let turn = onlyNew ? maxTurn : 1; turn <= maxTurn; turn++) {
        const actions = newActions.filter((a) => a.turn === turn)
        for (const action of actions) {
          console.log('Processing action:', action)
          try {
            this.state.applyAction(action, onlyNew)
          } catch (error) {
            console.error(`Error processing action:`, error)
          }
        }
        this.registredActionsPerRoot = {}
        this.state.refreshProteinsAndWallsAfterAction()

        if (onlyNew) {
          this.isCanvasAnimating = this.state.checkSporeAnimation()
          await this.waitAnimation()

          this.isCanvasAnimating = this.state.checkGrowAnimation()
          await this.waitAnimation()

          this.isCanvasAnimating = this.state.checkHarvesterAnimation()
          await this.waitAnimation()

          this.isCanvasAnimating = this.state.checkTentacleAttacksAnimation()
          await this.waitAnimation()
        }

        this.state.doTentacleAttacks()

        if (onlyNew) {
          this.isCanvasAnimating = this.state.checkIsDyingAnimation()
          await this.waitAnimation()
        }

        this.state.cleanOldOrgans()
        this.state.cleanGrowingOrgans()
      }

      const gameCanvas = this.$refs.gameCanvas as typeof GameCanvas
      if (gameCanvas) {
        gameCanvas.drawGrid()
      }
      console.debug('Actions handled')
    },
    async waitAnimation() {
      while (this.isCanvasAnimating) {
        await sleep(100)
      }
    },
    addActionToRoot(action: GrowAction | SporeAction, rootId: number) {
      this.registredActionsPerRoot[rootId] = action
    },
    changePlayerId() {
      this.playerId = this.playerId === Owner.ONE ? Owner.TWO : Owner.ONE
    },
    async copyShareLink() {
      if (!this.game) return

      const oppositePlayerId = this.playerId === Owner.ONE ? Owner.TWO : Owner.ONE
      const oppositePlayerUuid = Object.keys(this.game.playerIds).find(
        (uuid) => this.game?.playerIds[uuid] === oppositePlayerId,
      )
      const url = `${import.meta.env.VITE_CELLULARENA_URL}/game/${this.gameId}/player/${oppositePlayerUuid}`

      try {
        await navigator.clipboard.writeText(url)
        this.copyStatus = 'Copied!'
        setTimeout(() => {
          this.copyStatus = 'Share Link'
        }, 2000)
      } catch (err) {
        console.error('Failed to copy:', err)
        this.copyStatus = 'Failed to copy'
      }
    },
    checkOrientation() {
      this.needsRotation = window.innerHeight > window.innerWidth
    },
    async loadBot(botName: string): Promise<Bot> {
      try {
        const response = await fetch(`/bots/${botName}.js`)
        if (!response.ok) {
          throw new Error(`Failed to fetch bot: ${botName}`)
        }
        const code = await response.text()
        const blob = new Blob([code], { type: 'text/javascript' })
        const url = URL.createObjectURL(blob)
        const module = await import(/* @vite-ignore */ url)
        URL.revokeObjectURL(url)
        return (module.default || module) as Bot
      } catch (error) {
        console.error(`Failed to load bot: ${botName}`, error)
        throw error
      }
    },
    getSerializedState() {
      const botPlayerId = this.playerId === Owner.ONE ? Owner.TWO : Owner.ONE
      const serializedState = this.state.createInputsForAI(botPlayerId).join('\n')

      return serializedState
    },
    async resolveAIActions() {
      if (!this.bot) {
        throw new Error('Bot is not initialized')
      }

      const botPlayerId = this.playerId === Owner.ONE ? Owner.TWO : Owner.ONE

      const inputs = this.state.createInputsForAI(botPlayerId)
      console.log(inputs.join('\n'))

      const actionsStr = this.bot.run(inputs)
      console.log(actionsStr)

      const actions = actionsStr.map((actionStr) => {
        const [actionType, ...args] = actionStr.split(' ')
        const turn = this.state.turn
        if (actionType === 'WAIT') {
          return new WaitAction(botPlayerId, turn)
        } else if (actionType === 'GROW') {
          const [organId, x, y, type, direction] = args
          return new GrowAction(
            botPlayerId,
            turn,
            Number(organId),
            { x: Number(x), y: Number(y) },
            type as OrganType,
            direction as Direction,
          )
        } else if (actionType === 'SPORE') {
          const [organId, x, y] = args
          return new SporeAction(botPlayerId, turn, Number(organId), { x: Number(x), y: Number(y) })
        } else {
          throw new Error(`Unknown action type: ${actionType}`)
        }
      })
      for (const action of actions) {
        const collectionRef = collection(
          useFirestore(),
          'games',
          this.gameId,
          'actions',
        ).withConverter(actionFirestoreConvertor)
        await addDoc(collectionRef, action)
      }

      const waitingForActionsField = `waitingForActions.${botPlayerId}`
      await updateDoc(this.gameRef, {
        [waitingForActionsField]: false,
      })
    },
    async handleEndGame() {
      const { winner, reason } = this.endGameChecker.checkWinner()
      if (winner !== null) {
        await updateDoc(this.gameRef, {
          winner,
        })
        this.winner = winner
        this.winReason = reason
      }
    },
    async replayRefresh() {
      this.state = new State()
      await this.initializeGame(this.game!.seed)
    },
    async replayNextTurn() {
      this.state.turn++
      this.handleActions(true)
      await this.handleEndGame()
    },
    handleGiveUp() {
      this.winner = this.playerId === Owner.ONE ? Owner.TWO : Owner.ONE
      this.winReason = 'Give Up'
    },
  },
})
</script>

<style>
/* Add these global styles at the top */
:root {
  background-color: white;
}

body {
  margin: 0;
  padding: 0;
  background-color: white;
}

.actions-panel {
  flex: 0 0 300px; /* Largeur fixe pour le panneau d'actions */
  margin-left: 0px;
}

.canvas-container {
  flex: 1; /* Le canvas prend l'espace restant */
  display: flex;
  justify-content: center; /* Centrer le canvas horizontalement */
  position: relative;
}

#gameCanvas {
  border: 1px solid black;
  display: block;
  margin: 0 auto;
}

#infoDisplay {
  text-align: center;
  margin-bottom: 30px;
  font-family: Arial, sans-serif;
  font-size: 14px;
  color: #333;
}

.waiting-message {
  text-align: center;
  margin: 20px auto;
  padding: 15px;
  font-size: 18px;
  color: #666;
  background-color: #f5f5f5;
  border-radius: 5px;
  max-width: 400px;
}

.game-layout {
  background: url('../assets/background.jpg') no-repeat center center fixed;
  min-height: 100vh;
  display: flex;
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
  -ms-flex-direction: column;
  flex-direction: column;
  min-height: 100vh;
}

.info-section {
  width: 100%;
  margin-bottom: 20px;
}

.players-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto 2%; /* Added bottom margin */
  position: relative;
}

.left-player,
.right-player {
  flex: 0 0 250px;
}

.info-display {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  font-family: Arial, sans-serif;
  font-size: 50%;
  color: rgb(155, 16, 16);
  white-space: nowrap;
}

.main-section {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  gap: 3%;
  flex: 1;
}

.canvas-wrapper {
  flex: 0 1 auto;
  position: relative;
}

.share-button-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.share-button {
  padding: 8px 16px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
  white-space: nowrap;
}

.share-button:hover {
  background-color: #45a049;
}

.give-up-button {
  padding: 8px 16px;
  background-color: red;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
  white-space: nowrap;
}

.top-section {
  margin-bottom: 1%;
}

.game-area {
  background-color: rgba(255, 255, 255, 0);
  padding: 2%;
}

.action-buttons {
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-top: 2%;
}

.action-buttons button {
  margin: 0 10px; /* Add horizontal space between buttons */
}

button {
  padding: 1% 2%;
  border-radius: 4px;
  border: none;
  background-color: #4caf50;
  color: white;
  cursor: pointer;
  font-size: 85%;
  transition: background-color 0.3s;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.rotation-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.9);
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
}

.rotation-content {
  text-align: center;
  color: white;
  padding: 20px;
}

.rotate-icon {
  font-size: 48px;
  animation: rotate 2s infinite linear;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.loading-spinner {
  display: inline-block;
  margin-right: 8px;
  animation: rotate 1s linear infinite;
}

.center-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.8rem;
}

@media (max-height: 500px) and (orientation: landscape) {
  .center-controls {
    flex-direction: row;
    gap: 1rem;
  }
}

@media (max-width: 1300px) {
  button {
    font-size: 10px;
  }

  .share-button {
    padding: 4px 8px;
  }
}
</style>
