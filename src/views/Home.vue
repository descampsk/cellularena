<template>
  <div class="home">
    <div class="content">
      <img src="../assets/cellularena.png" alt="Cellularena" class="logo" />
      <nav class="menu">
        <button class="menu-button" @click="showCreateDialog = true">
          <span class="button-content">Create Game</span>
        </button>
        <!-- Add more menu buttons here -->
      </nav>
    </div>
    <CreateGameDialog v-model="showCreateDialog" :createGame="handleGameCreate" />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { useFirestore } from 'vuefire'
import { doc, setDoc } from 'firebase/firestore'
import { v4 as uuidv4 } from 'uuid'
import { Game, gameFirestoreConvertor } from '@/game/Game'
import { Owner } from '@/game/Entity'
import { logEvent } from 'firebase/analytics'
import { firebaseAnalytics } from '@/infra/firebase'
import CreateGameDialog from '@/components/CreateGameDialog.vue'

const seeds = [
  '-109498249532328380',
  '155549240508571069',
  '4748602558057728000',
  '5931977594442630112',
  '7621060308853830000',
  '-110221706056499790',
  '211264768185193440',
  '4828169237660710000',
  '5979263919950389741',
  '7647223510213090658',
  '1181878746852622272',
  '-2194086977806973000',
  '5119320096785750000',
  '6374963278771192000',
  '7912673889433137414',
  '-1471184786810387200',
  '403701809741153383',
  '-5149157639354022000',
  '-6401560456697912000',
  '-7999696972769541000',
  '-1536354671034605600',
  '4038497759783998197',
  '5640191983874642000',
  '6510848175589428331',
  '8489931167210928781',
  '1543001585024110057',
  '4728951963199696047',
  '5715602376772326278',
  '7500291002500587345',
]

export default defineComponent({
  name: 'HomeView',
  components: {
    CreateGameDialog,
  },
  data() {
    return {
      showCreateDialog: ref(false),
    }
  },
  methods: {
    async handleGameCreate(settings: { mode: 'versus' | 'solo' | 'training' }) {
      this.showCreateDialog = false

      const db = useFirestore()
      const playerOneUuid = uuidv4()
      const playerTwoUuid = uuidv4()
      const seed = seeds[Math.floor(Math.random() * seeds.length)]

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
  max-width: 400px;
  margin-bottom: 4rem;
  filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.3));
  animation: glow 2s ease-in-out infinite alternate;
}

.menu {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
}

.menu-button {
  background: transparent;
  border: 2px solid #4caf50;
  color: #4caf50;
  padding: 1rem 2rem;
  font-size: 1.2rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 200px;
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
</style>
