import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import SearchView from '../views/SearchView.vue'
import MovieView from '../views/MovieView.vue'
import WatchlistView from '../views/WatchlistView.vue'
import DashboardView from '../views/DashboardView.vue'
import RecommendationsView from '../views/RecommendationsView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'

const routes = [
  { path: '/',               component: HomeView },
  { path: '/search',         component: SearchView },
  { path: '/movie/:id',      component: MovieView },
  { path: '/watchlist',      component: WatchlistView },
  { path: '/dashboard',      component: DashboardView },
  { path: '/recommendations', component: RecommendationsView },
  { path: '/login',          component: LoginView },
  { path: '/register',       component: RegisterView },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
