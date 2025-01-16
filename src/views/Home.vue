<template>
  <div class="home">
    <div class="content">
      <img src="../assets/cellularena.png" alt="Cellularena" class="logo" />
      <nav class="menu">
        <button class="menu-button" @click="showCreateDialog = true">
          <span class="button-content">Create Game</span>
        </button>
        <button class="menu-button" @click="showReplayDialog = true">
          <span class="button-content">Replay a Game</span>
        </button>
        <!-- Add more menu buttons here -->
      </nav>
    </div>
    <CreateGameDialog v-model="showCreateDialog" :createGame="handleGameCreate" />
    <ReplayGameDialog v-model="showReplayDialog" :launchReplay="launchReplay" />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { useFirestore } from 'vuefire'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { v4 as uuidv4 } from 'uuid'
import { Game, gameFirestoreConvertor } from '@/game/Game'
import { Owner } from '@/game/Entity'
import { logEvent } from 'firebase/analytics'
import { firebaseAnalytics } from '@/infra/firebase'
import CreateGameDialog from '@/components/CreateGameDialog.vue'
import ReplayGameDialog from '@/components/ReplayGameDialog.vue'
import { getRandomSeed } from '@/game/maps'

export default defineComponent({
  name: 'HomeView',
  components: {
    CreateGameDialog,
    ReplayGameDialog,
  },
  data() {
    return {
      showCreateDialog: ref(false),
      showReplayDialog: ref(false),
      replayDialogError: null as string | null,
    }
  },
  methods: {
    async handleGameCreate(settings: { mode: 'versus' | 'solo' | 'training' }) {
      this.showCreateDialog = false

      const db = useFirestore()
      const playerOneUuid = uuidv4()
      const playerTwoUuid = uuidv4()
      const seed = getRandomSeed()

      const game = new Game({
        seed,
        playerIds: {
          [playerOneUuid]: Owner.ONE,
          [playerTwoUuid]: Owner.TWO,
        },
        mode: settings.mode,
      })

      logEvent(firebaseAnalytics, 'create_game', {
        mode: settings.mode,
      })

      const gameDoc = doc(db, 'games', game.id).withConverter(gameFirestoreConvertor)
      await setDoc(gameDoc, game)

      // Route to the new game
      this.$router.push(`/game/${game.id}/player/${playerOneUuid}`)
    },
    async launchReplay(gameId: string) {
      const gameRef = doc(useFirestore(), 'games', gameId).withConverter(gameFirestoreConvertor)
      const gameDoc = await getDoc(gameRef)
      const game = gameDoc.data()

      if (!game) {
        this.replayDialogError = 'Game not found'
        return
      }

      this.showReplayDialog = false

      // Route to the replay game
      this.$router.push(`/replay/${gameId}`)
    },
  },
})
</script>

<style scoped>
.home {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: url('../assets/background.jpg') no-repeat center center fixed;
  background-size: cover;
  position: relative;
  padding: 1rem;
}

.home::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
}

.content {
  position: relative;
  text-align: center;
  z-index: 1;
}

.logo {
  max-width: min(400px, 80vw);
  margin-bottom: 2rem;
  filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.3));
  animation: glow 2s ease-in-out infinite alternate;
}

.menu {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
}

.menu-button {
  background: transparent;
  border: 2px solid #4caf50;
  color: #4caf50;
  padding: 0.8rem 1.5rem;
  font-size: clamp(1rem, 3vw, 1.2rem);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  width: min(200px, 80vw);
  position: relative;
  overflow: hidden;
}

.menu-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(120deg, transparent, rgba(76, 175, 80, 0.2), transparent);
  transition: 0.5s;
}

.menu-button:hover::before {
  left: 100%;
}

.menu-button:hover {
  background: rgba(76, 175, 80, 0.1);
  box-shadow: 0 0 20px rgba(76, 175, 80, 0.3);
  transform: scale(1.05);
}

.button-content {
  position: relative;
  z-index: 1;
}

@keyframes glow {
  from {
    filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.3));
  }
  to {
    filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.5));
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .home {
    padding: 0.5rem;
  }

  .logo {
    margin-bottom: 1.5rem;
  }

  .menu {
    gap: 0.8rem;
  }

  .menu-button {
    padding: 0.6rem 1.2rem;
  }
}

/* Landscape mode on mobile */
@media (max-height: 500px) and (orientation: landscape) {
  .home {
    padding: 0.5rem 2rem;
  }

  .content {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 2rem;
    justify-content: center;
  }

  .logo {
    max-width: min(300px, 40vw);
    margin-bottom: 0;
  }

  .menu {
    gap: 0.5rem;
  }

  .menu-button {
    padding: 0.4rem 1rem;
    font-size: clamp(0.8rem, 2.5vw, 1rem);
  }
}
</style>
