# CineMatch

CineMatch is a personalized movie discovery and recommendation web app. Search and browse films from the TMDB database, build a watchlist, track your watch history, and get AI-powered recommendations based on your taste — all backed by a semantic recommendation engine using OpenAI vector embeddings.

## Features

- **Search & Browse** — Full-text movie search with filters for genre, year, language, and rating
- **Watchlist** — Add movies, reorder them with drag-and-drop, and mark them as watched
- **Movie Detail Pages** — Full metadata, embedded trailers, cast carousel, and similar movie suggestions
- **Recommendation Engine** — Semantic recommendations using OpenAI `text-embedding-3-small` and cosine similarity against your watch history
- **Taste Dashboard** — D3-powered charts showing your genre breakdown, mood radar, watch timeline, and movies by decade
- **Authentication** — Register and login with email/password; sessions secured via JWT

---

## Tech Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Frontend   | Vue 3 (Composition API), Vue Router, Pinia, Tailwind CSS |
| Charts     | D3.js                                   |
| Backend    | Node.js + Express.js                    |
| Database   | SQLite (`better-sqlite3`)               |
| Auth       | JWT + bcrypt                            |
| Movie Data | TMDB API                                |
| New Tech   | OpenAI `text-embedding-3-small` embeddings |

---

## Prerequisites

- Node.js 18+
- A free [TMDB API key](https://www.themoviedb.org/settings/api)
- An [OpenAI API key](https://platform.openai.com/api-keys)

---

## Setup

### 1. Clone the repo

```bash
git clone <repo-url>
cd cinematch
```

### 2. Install dependencies

Install server and client dependencies separately:

```bash
# Root (server) dependencies
npm install

# Frontend dependencies
cd client && npm install && cd ..
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your values:

```
TMDB_API_KEY=     # https://www.themoviedb.org/settings/api
OPENAI_API_KEY=   # https://platform.openai.com/api-keys
JWT_SECRET=       # any random string, e.g. output of: openssl rand -hex 32
CLIENT_ORIGIN=http://localhost:5173
PORT=3000
```

---

## Running the App

CineMatch has two processes: an Express API server and a Vite frontend dev server. Run them in separate terminals.

**Terminal 1 — API server** (port 3000):

```bash
npm run dev:server
```

**Terminal 2 — Frontend** (port 5173):

```bash
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173).

---

## Scripts

| Script | Description |
|---|---|
| `npm run dev:server` | Start the Express backend with `nodemon` (auto-restarts on file changes) |
| `npm run dev` | Start the Vite frontend dev server (alias for `dev:client`) |
| `npm run dev:client` | Start the Vite frontend dev server |
| `npm run build` | Build the Vue app into `client/dist` |
| `npm start` | Start Express in production mode, serves `client/dist` if built |
| `npm run seed:demo-user` | Populate the database with a demo user for testing (see below) |

---

## Demo User (Optional)

To quickly populate the app with realistic data for a demo or grading, run the seed script:

```bash
npm run seed:demo-user
```

This script:
1. Creates a user account (`demo.anime@cinematch.local` / `password`)
2. Fetches 10 anime films from TMDB and adds them to the user's watch history
3. Fetches 6 more films and adds them to the user's watchlist
4. Pre-warms the OpenAI embeddings for all seeded movies so recommendations work immediately

> **Requires** both `TMDB_API_KEY` and `OPENAI_API_KEY` to be set in `.env`. The script makes live API calls to TMDB and OpenAI — expect it to take 30–60 seconds to complete.

After seeding, log in with:
- **Email:** `demo.anime@cinematch.local`
- **Password:** `password`

---

## Production Build

Build the frontend and serve everything from the Express server on a single port:

```bash
npm run build
npm start
```

Open [http://localhost:3000](http://localhost:3000).
