<template>
  <div class="cine-app-container">

    <main class="preferences-main">
      <header class="pref-page-header">
        <div class="header-content">
          <h1 class="page-title">Preferences</h1>
        </div>
        <p class="page-description">Customize your movie recommendations by setting your preferences</p>
      </header>

      <div class="pref-sections-list">
        <section class="pref-section card bg-white/[0.02]">
          <h2 class="section-title">Favorite Genres</h2>
          <p class="section-description">Select the genres you enjoy most.</p>
          <div class="tag-grid">
            <button v-for="genre in genres" :key="genre" class="tag-button bg-white/[0.04]"
              :class="{ 'tag-button-active': selectedGenres.includes(genre) }"
              @click="toggleItem(selectedGenres, genre)">
              {{ genre }}
            </button>
          </div>
        </section>

        <section class="pref-section card bg-white/[0.02]">
          <h2 class="section-title">Preferred Decades</h2>
          <p class="section-description">Choose your favorite movie eras.</p>
          <div class="tag-grid">
            <button v-for="decade in decades" :key="decade" class="tag-button bg-white/[0.04]"
              :class="{ 'tag-button-active': selectedDecades.includes(decade) }"
              @click="toggleItem(selectedDecades, decade)">
              {{ decade }}
            </button>
          </div>
        </section>

        <section class="pref-section card bg-white/[0.02]">
          <div class="rating-header">
            <h2 class="section-title">Minimum Rating</h2>
            <div class="rating-display">
              <span>⭐</span>
              <span class="rating-value">{{ minRating.toFixed(1) }}</span>
            </div>
          </div>
          <div class="slider-container">
            <input type="range" v-model.number="minRating" min="0" max="10" step="0.1" class="rating-slider" />
            <div class="slider-labels">
              <span>0.0</span>
              <span>5.0</span>
              <span>10.0</span>
            </div>
          </div>
        </section>

        <section class="summary-section">
          <h2 class="summary-title">Your Preferences Summary</h2>
          <div class="summary-content">
            <p><strong>Genres:</strong> <span>{{ genreSummary }}</span></p>
            <p><strong>Decades:</strong> <span>{{ decadeSummary }}</span></p>
            <p><strong>Min Rating:</strong> {{ minRating.toFixed(1) }} stars</p>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const genres = ['Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary', 'Drama', 'Family', 'Fantasy', 'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Thriller', 'War']
const decades = ['2020s', '2010s', '2000s', '1990s', '1980s', '1970s', 'Classic']

const selectedGenres = ref<string[]>([])
const selectedDecades = ref<string[]>([])
const minRating = ref(7.0)

const toggleItem = (list: string[], item: string) => {
  const index = list.indexOf(item)
  if (index === -1) list.push(item)
  else list.splice(index, 1)
}

const genreSummary = computed(() => selectedGenres.value.length > 0 ? selectedGenres.value.join(', ') : 'None selected')
const decadeSummary = computed(() => selectedDecades.value.length > 0 ? selectedDecades.value.join(', ') : 'None selected')
</script>

<style scoped>

/* Stable Nav Buttons */
.cine-nav-btn {
  background: #1a1d26;
  border: 1px solid #000000;
  /* Fixed border width */
  color: #a0a6b1;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}

.cine-nav-btn-active {
  background: #2d265e;
  border-color: #4b4194;
  /* Only color changes, not width */
  color: white;
}

.preferences-main {
  max-width: 1000px;
  margin: 0 auto;
  padding: 40px 20px;
}

.page-title {
  font-size: 32px;
  margin: 0;
}

.page-description {
  color: #8b949e;
  margin: 10px 0 30px 0;
}

.pref-sections-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card {
  border: 1px solid #30363d;
  border-radius: 12px;
  padding: 24px;
}

.section-title {
  font-size: 18px;
  margin: 0 0 10px 0;
  color: #f0f6fc;
}

.section-description {
  color: #8b949e;
  font-size: 14px;
  margin-bottom: 20px;
}

.tag-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

/* Fixed Size Tag Buttons */
.tag-button {
  /* background: transparent; */
  border: 1px solid #30363d;
  /* Fixed 1px border */
  color: #c9d1d9;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s, border-color 0.2s;
  font-size: 14px;
  line-height: 1.2;
  /* Avoid font-weight change to keep text width exact */
}

.tag-button-active {
  background: #f0f6fc;
  border-color: #f0f6fc;
  /* Same 1px width, different color */
  color: #0d1117;
}

/* Rating */
.rating-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.rating-display {
  font-weight: bold;
  color: #ffca28;
  display: flex;
  gap: 5px;
}

.rating-slider {
  width: 100%;
  accent-color: #4b4194;
  cursor: pointer;
  margin-top: 15px;
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  color: #8b949e;
  font-size: 12px;
}

/* Summary */
.summary-section {
  padding: 10px 0;
}

.summary-title {
  font-size: 20px;
  margin-bottom: 15px;
}

.summary-content p {
  margin: 8px 0;
  color: #8b949e;
  font-size: 14px;
}

.summary-content span {
  color: #f0f6fc;
}
</style>