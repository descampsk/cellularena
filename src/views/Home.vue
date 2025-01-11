<template>
  <div>
    <h1>Cellularena</h1>
    <button @click="createGame">Create Game</button>
    <!-- <input v-model="gameId" placeholder="Enter Game ID" />
    <button @click="joinGame">Join Game</button> -->
  </div>
</template>

<script lang="ts">
// import { ref, set } from '../../firebase'
import { doc, setDoc } from 'firebase/firestore'
import { v4 as uuidv4 } from 'uuid'
import { useFirestore } from 'vuefire'
import { Game, gameFirestoreConvertor } from '@/game/Game'
import { Owner } from '@/game/Entity'

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

export default {
  name: 'HomeView',
  data() {
    return { gameId: '' }
  },
  methods: {
    async createGame() {
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
      })
      const gameDoc = doc(db, 'games', game.id).withConverter(gameFirestoreConvertor)
      setDoc(gameDoc, game)
      this.$router.push(`/game/${game.id}/player/${playerOneUuid}`)
    },
    joinGame() {
      if (this.gameId) {
        this.$router.push(`/game/${this.gameId}`)
      }
    },
  },
}
</script>
