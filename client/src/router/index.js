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
  { path: '/watchlist',      component: WatchlistView,      meta: { requiresAuth: true } },
  // Watch history now lives inside the Watchlist page behind a tab toggle.
  // Redirect legacy `/history` links so external bookmarks keep working.
  { path: '/history',        redirect: { path: '/watchlist', query: { view: 'history' } } },
  { path: '/dashboard',      component: DashboardView,      meta: { requiresAuth: true } },
  { path: '/recommendations', component: RecommendationsView, meta: { requiresAuth: true } },
  { path: '/login',          component: LoginView },
  { path: '/register',       component: RegisterView },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !localStorage.getItem('token')) {
    return '/login'
  }
})

export default router
