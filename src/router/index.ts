import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/Home.vue'
import Game from '../views/Game.vue'

const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/game/:gameId', name: 'game', component: Game },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
