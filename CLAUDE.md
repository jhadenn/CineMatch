# CineMatch â€” Product Requirements Document

**Version:** 1.0  
**Due:** April 17, 2025  
**Team Size:** 5 members  

---

## Table of Contents

1. [Overview](#overview)
2. [Problem & Goals](#problem--goals)
3. [User Stories](#user-stories)
4. [Features & Requirements](#features--requirements)
5. [Technical Stack](#technical-stack)
6. [Application Structure](#application-structure)
7. [Vue Component Tree](#vue-component-tree)
8. [Express API Routes](#express-api-routes)
9. [Database Schema](#database-schema)
10. [Recommendation Engine](#recommendation-engine)
11. [Rubric Mapping](#rubric-mapping)
12. [Submission Checklist](#submission-checklist)

---

## Overview

CineMatch is a personalized movie discovery and recommendation web application. Users search and can save films to watchlists, while an intelligent recommendation engine learns their taste and surfaces movies they are likely to love. Rich D3-powered visualizations give users insight into their own viewing habits and preferences.

---

## Problem & Goals

Deciding what to watch is overwhelming â€” streaming platforms surface algorithmic content that favors their own catalogue. CineMatch puts the user in control: a personal watchlist and viewing history feed a transparent recommendation engine, and dashboards reveal patterns in their own taste over time.

**Goals:**
- Let users discover movies through search, filters, and smart recommendations
- Provide a personal watchlist and watch history system
- Visualize user taste with interactive D3 charts
- Demonstrate all course technologies in a cohesive, production-ready app

---

## User Stories

| As a...       | I want to...                                      | So that...                                      |
|---------------|---------------------------------------------------|-------------------------------------------------|
| Guest user    | Search and browse movies                          | I can explore content without an account        |
| Registered user | Save movies to my watchlist                    | I can track what I want to watch                |
| Registered user | Mark movies as watched                         | My history feeds the recommendation engine      |
| Registered user | Get personalized recommendations               | I discover movies tailored to my taste          |
| Registered user | View my taste dashboard                        | I understand my own viewing patterns            |
| Any user      | View full movie details with trailers            | I can decide if a movie interests me            |

---

## Features & Requirements

### 1. Search & Browse

- Full-text movie search via TMDB API
- Filter by genre, release year, language, and minimum rating
- Infinite scroll results with poster cards
- Trending and new release sections on the home page

### 2. Watchlist

- Add/remove movies to a personal watchlist
- Mark movies as watched (moves to history)
- Drag-and-drop reordering of watchlist items

### 3. Movie Detail Page

- Full metadata: title, overview, genres, release date, runtime, language
- Embedded YouTube trailer via TMDB video endpoint
- Cast carousel with headshots from TMDB
- Similar movie suggestions pulled from TMDB `/movie/{id}/similar`
- Link to full cast and crew page

### 4. Recommendation Engine *(new technology)*
 
- Semantic similarity powered by OpenAI `text-embedding-3-small` model
- Each movie's overview + genres + director are embedded into a vector on first watch and cached in the DB
- A user profile vector is computed by averaging all watched movie embeddings
- Candidate movies (trending + popular from TMDB, not yet watched) are scored by cosine similarity against the profile vector
- Recommendation feed shown on home page and dedicated `/recommendations` page

### 5. Taste Dashboard

- **Genre breakdown** - D3 pie/donut chart of watched genres
- **Mood preferences** - D3 radar chart derived from the genres in watch history
- **Watch history timeline** - D3 line/area chart of movies watched per month
- **Movies by decade** - D3 bar chart of watched movies grouped by release decade

### 6. Authentication

- Register and login with email and password
- Passwords hashed with `bcrypt`
- Sessions managed via JWT stored in `localStorage`
- Protected routes redirect unauthenticated users to login

---

## Technical Stack

| Layer         | Technology                          |
|---------------|-------------------------------------|
| Frontend      | Vue 3 (Composition API)             |
| Routing       | Vue Router                          |
| State         | Pinia                               |
| Styling       | Tailwind CSS                        |
| Charts        | D3.js                               |
| Backend       | Node.js + Express.js                |
| Database      | SQLite (via `better-sqlite3`)       |
| External API  | TMDB API (free tier)                |
| Auth          | JWT + bcrypt                        |
| New Tech      | OpenAI Embeddings API (`text-embedding-3-small`)  |

> **Why SQLite?** Zero setup, file-based, works out of the box on any machine for demo and grading purposes.

> **Why OpenAI embeddings?** `text-embedding-3-small` is cheap (fractions of a cent per request at this scale), production-grade, and semantically richer than hand-crafted genre vectors. Embedding vectors are generated once per movie and cached in the DB, so the API is rarely called after initial setup.

---
 
## Application Structure
 
```
cinematch/
├── client/                   # Vue 3 frontend
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── NavBar.vue
│   │   │   │   └── Footer.vue
│   │   │   ├── movie/
│   │   │   │   ├── MovieCard.vue
│   │   │   │   ├── MovieGrid.vue
│   │   │   │   ├── MovieDetail.vue
│   │   │   │   ├── CastCarousel.vue
│   │   │   │   └── TrailerEmbed.vue
│   │   │   ├── search/
│   │   │   │   ├── SearchBar.vue
│   │   │   │   └── FilterPanel.vue
│   │   │   ├── watchlist/
│   │   │   │   ├── WatchlistPanel.vue
│   │   │   │   └── WatchlistItem.vue
│   │   │   ├── dashboard/
│   │   │   │   ├── GenrePieChart.vue
│   │   │   │   ├── TimelineChart.vue
│   │   │   │   ├── DecadeHeatmap.vue
│   │   │   │   └── DirectorBarChart.vue
│   │   │   ├── recommendations/
│   │   │   │   └── RecoFeed.vue
│   │   │   └── auth/
│   │   │       ├── LoginForm.vue
│   │   │       └── RegisterForm.vue
│   │   ├── views/
│   │   │   ├── HomeView.vue
│   │   │   ├── SearchView.vue
│   │   │   ├── MovieView.vue
│   │   │   ├── WatchlistView.vue
│   │   │   ├── DashboardView.vue
│   │   │   ├── RecommendationsView.vue
│   │   │   ├── LoginView.vue
│   │   │   └── RegisterView.vue
│   │   ├── stores/
│   │   │   ├── auth.js
│   │   │   ├── watchlist.js
│   │   │   └── movies.js
│   │   ├── router/
│   │   │   └── index.js
│   │   ├── services/
│   │   │   ├── tmdb.js           # TMDB API calls
│   │   │   └── api.js            # Own backend API calls
│   │   └── App.vue
│   ├── index.html
│   └── vite.config.js
│
├── server/                   # Express.js backend
│   ├── routes/
│   │   ├── auth.js
│   │   ├── watchlist.js
│   │   ├── history.js
│   │   └── recommendations.js
│   ├── middleware/
│   │   └── auth.js            # JWT verification middleware
│   ├── db/
│   │   ├── schema.sql
│   │   └── database.js
│   ├── services/
│   │   └── recommender.js     # OpenAI embedding-based recommendation engine
│   └── index.js
│
├── group_members.html
├── contributions.txt
├── intro.mp4
├── .env.example
├── package.json
└── README.md
```
 
---
 
## Vue Component Tree
 
```
App.vue
├── NavBar.vue
├── router-view
│   ├── HomeView.vue
│   │   ├── SearchBar.vue
│   │   ├── MovieGrid.vue (trending)
│   │   │   └── MovieCard.vue (×n)
│   │   └── RecoFeed.vue (if logged in)
│   │       └── MovieCard.vue (×n)
│   │
│   ├── SearchView.vue
│   │   ├── SearchBar.vue
│   │   ├── FilterPanel.vue
│   │   └── MovieGrid.vue (results, infinite scroll)
│   │       └── MovieCard.vue (×n)
│   │
│   ├── MovieView.vue
│   │   ├── TrailerEmbed.vue
│   │   ├── CastCarousel.vue
│   │   └── MovieGrid.vue (similar movies)
│   │
│   ├── WatchlistView.vue
│   │   └── WatchlistItem.vue (×n, drag-and-drop)
│   │
│   ├── DashboardView.vue
│   │   ├── GenrePieChart.vue       (D3)
│   │   ├── TimelineChart.vue       (D3)
│   │   ├── DecadeHeatmap.vue       (D3)
│   │   └── DirectorBarChart.vue    (D3)
│   │
│   ├── RecommendationsView.vue
│   │   └── RecoFeed.vue
│   │       └── MovieCard.vue (×n)
│   │
│   ├── LoginView.vue
│   │   └── LoginForm.vue
│   │
│   └── RegisterView.vue
│       └── RegisterForm.vue
│
└── Footer.vue
```

---
 
## Express API Routes
 
### Auth  `/api/auth`
 
| Method | Route       | Description              | Auth required |
|--------|-------------|--------------------------|---------------|
| POST   | `/register` | Create new account       | No            |
| POST   | `/login`    | Login, returns JWT       | No            |
| GET    | `/me`       | Get current user profile | Yes           |
 
### Watchlist  `/api/watchlist`
 
| Method | Route    | Description                        | Auth required |
|--------|----------|------------------------------------|---------------|
| GET    | `/`      | Get user's watchlist               | Yes           |
| POST   | `/`      | Add movie to watchlist             | Yes           |
| DELETE | `/:id`   | Remove movie from watchlist        | Yes           |
| PATCH  | `/order` | Update watchlist item order        | Yes           |
 
### Watch History  `/api/history`
 
| Method | Route   | Description                      | Auth required |
|--------|---------|----------------------------------|---------------|
| GET    | `/`     | Get user's full watch history    | Yes           |
| POST   | `/`     | Mark a movie as watched          | Yes           |
| DELETE | `/:id`  | Remove from history              | Yes           |
 
### Recommendations  `/api/recommendations`
 
| Method | Route | Description                                      | Auth required |
|--------|-------|--------------------------------------------------|---------------|
| GET    | `/`   | Get personalized recommendations for current user | Yes           |
 
---

## Database Schema
 
```sql
-- Users
CREATE TABLE users (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  email       TEXT UNIQUE NOT NULL,
  password    TEXT NOT NULL,            -- bcrypt hash
  username    TEXT NOT NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
 
-- Watchlist
CREATE TABLE watchlist (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id),
  tmdb_id     INTEGER NOT NULL,
  title       TEXT NOT NULL,
  poster_path TEXT,
  position    INTEGER NOT NULL DEFAULT 0,
  added_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, tmdb_id)
);
 
-- Watch history
CREATE TABLE watch_history (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id),
  tmdb_id     INTEGER NOT NULL,
  title       TEXT NOT NULL,
  poster_path TEXT,
  genres      TEXT NOT NULL,            -- JSON array: ["Action", "Drama"]
  director    TEXT,
  release_year INTEGER,
  watched_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, tmdb_id)
);
 
```
 
---
---
 
## Recommendation Engine
 
**API:** OpenAI `text-embedding-3-small`  
**Approach:** Semantic vector embeddings + cosine similarity
 
### How it works
 
1. **Embed each watched movie** â€” when a user marks a movie as watched, the server sends a text document (`"Title. Overview. Genres: Action, Drama. Director: Christopher Nolan"`) to the OpenAI Embeddings API and receives a 1536-dimension vector back. This vector is stored in the DB so the API is only ever called once per movie.
 
2. **Build a user profile vector** average all embedding vectors from the user's watch history into a single profile vector representing their taste.
 
3. **Score candidate movies** fetch trending + popular movies from TMDB that the user hasn't watched. Embed any that aren't already cached. Compute cosine similarity between each candidate's vector and the user's profile vector.
 
4. **Return top N results** sorted by similarity score.
 
### Why this approach is resume-worthy
 
- Uses the same embedding + cosine similarity pattern behind production recommendation systems at companies like Spotify and Netflix
- `text-embedding-3-small` captures semantic meaning  it understands that *Blade Runner* and *Ex Machina* are similar even if they share no cast or genre tags
- Can be honestly described as: *"Built a semantic recommendation engine using OpenAI vector embeddings and cosine similarity"*
 
### Implementation sketch (`server/services/recommender.js`)
 
```js
const OpenAI = require('openai');
const db = require('../db/database');
 
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
 
// Generate and cache an embedding for a movie
async function getEmbedding(movie) {
  const existing = db.prepare(
    'SELECT embedding FROM movie_embeddings WHERE tmdb_id = ?'
  ).get(movie.tmdb_id);
 
  if (existing) return JSON.parse(existing.embedding);
 
  const input = `${movie.title}. ${movie.overview}. Genres: ${movie.genres.join(', ')}. Director: ${movie.director ?? 'Unknown'}.`;
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input,
  });
 
  const vector = response.data[0].embedding;
  db.prepare(
    'INSERT OR IGNORE INTO movie_embeddings (tmdb_id, embedding) VALUES (?, ?)'
  ).run(movie.tmdb_id, JSON.stringify(vector));
 
  return vector;
}
 
// Cosine similarity between two vectors
function cosineSimilarity(a, b) {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dot / (magA * magB);
}
 
// Average a list of vectors into one profile vector
function averageVectors(vectors) {
  const len = vectors[0].length;
  const sum = new Array(len).fill(0);
  for (const vec of vectors) vec.forEach((v, i) => { sum[i] += v; });
  return sum.map(v => v / vectors.length);
}
 
// Main export â€” called by GET /api/recommendations
async function getRecommendations(watchedMovies, candidates) {
  if (watchedMovies.length === 0) return candidates.slice(0, 10);
 
  const watchedVectors = await Promise.all(watchedMovies.map(getEmbedding));
  const profile = averageVectors(watchedVectors);
 
  const scored = await Promise.all(
    candidates.map(async movie => ({
      ...movie,
      score: cosineSimilarity(profile, await getEmbedding(movie)),
    }))
  );
 
  return scored.sort((a, b) => b.score - a.score).slice(0, 20);
}
 
module.exports = { getRecommendations };
```
 
### Additional DB table required
 
```sql
-- Cached OpenAI embedding vectors (1536 dimensions, stored as JSON)
CREATE TABLE movie_embeddings (
  tmdb_id   INTEGER PRIMARY KEY,
  embedding TEXT NOT NULL            -- JSON array of 1536 floats
);
```
 
### Environment variable required
 
```
OPENAI_API_KEY=sk-...
TMDB_API_KEY=...
```
 
---
---

## UI Inspiration and Theme

The UI follows a modern aesthetic, using a minimalist, component-driven design system inspired by shadcn/ui combined with elements similar to Netflix's UI design. The layout is structured around reusable, card-based components with consistent spacing, subtle borders, and soft shadows to create a clean and low-noise visual hierarchy. The interface emphasizes usability and clarity, resembling an operating system or workspace environment rather than a traditional marketing site. Overall, the design reflects current best practices in frontend development, prioritizing responsiveness, modularity, and a polished, developer-centric user experience. Link to UI inspiration: https://cut-os.vercel.app/ & https://v0.app/templates/skal-ventures-template-tnZGzubtsTc

## Rubric Mapping

| Requirement          | Implementation                                                                 | Marks |
|----------------------|--------------------------------------------------------------------------------|-------|
| SVG & HTML           | Custom SVG logo, SVG icons for genre badges, watchlist empty state illustration | 1.0   |
| CSS & frameworks     | Tailwind CSS utility classes, custom CSS transitions for card hover states      | 1.0   |
| JavaScript, jQuery, D3 | D3 genre pie, mood radar chart, watch cadence, decade bar chart             | 1.5   |
| Dynamic DOM          | Live search filtering, infinite scroll results, drag-and-drop watchlist order  | 1.5   |
| AJAX & web services  | TMDB API (search, details, trailers, similar); own REST API for user data      | 1.0   |
| Node / Express       | Express REST API: auth, watchlist, history, recommendations endpoints          | 1.5   |
| Vue framework        | Composition API components, Vue Router, Pinia stores, reactive data binding    | 2.5   |
| New technology       | Semantic recommendation engine using OpenAI `text-embedding-3-small` API           | 1.0   |
| Intro video          | 3â€“5 min screen recording demonstrating all features and technologies            | 4.0   |
| **Total**            |                                                                                | **10.0** |


## Submission Checklist
- [X] No hardcoded API keys (use `.env` with `.env.example` provided)
- [X] App runs after installing root + client dependencies, then starting `npm run dev:server` and `npm run dev` in separate terminals
- [] `readme.txt`  Instructions on how to run your web app
- [X] `group_members.html`  table with all member names and Banner IDs
- [X] `contributions.txt` = each member's specific contributions listed
- [X] `intro.mp4` 5 min promo video demonstrating all features (and new technology)
- [X] README with clear setup steps (clone and install and add `.env` to run)

---



