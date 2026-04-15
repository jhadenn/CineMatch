# CineMatch

Personalized movie discovery and recommendation app built with Vue 3, Express, and OpenAI embeddings.

## Setup

### 1. Clone the repo

```bash
git clone <repo-url>
cd cinematch
```

### 2. Install dependencies

```bash
# Server dependencies (Express, SQLite, etc.)
npm install

# Frontend dependencies (Vue, Vite, Tailwind, etc.)
cd client && npm install && cd ..
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your keys:
- `TMDB_API_KEY` — get a free key at https://www.themoviedb.org/settings/api
- `OPENAI_API_KEY` — get a key at https://platform.openai.com/api-keys
- `JWT_SECRET` — any random string (e.g. `openssl rand -hex 32`)

### 4. Run the development servers

In one terminal, start the Express API server (port 3000):

```bash
npm run dev:server
```

In a second terminal, start the Vite frontend (port 5173):

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

### 5. Run a production-style local build

Build the Vue frontend:

```bash
npm run build
```

Start Express in normal mode:

```bash
npm start
```

Open http://localhost:3000 in your browser.

## Scripts

- `npm run dev:server`
  Starts the Express backend with `nodemon`.
- `npm run dev`
  Alias for `npm run dev:client`.
- `npm run dev:client`
  Starts the Vite frontend development server.
- `npm run build`
  Builds the Vue app into `client/dist`.
- `npm start`
  Starts Express in normal mode and serves the built frontend from `client/dist` when available.

## Example Usage

```bash
# backend only
npm run dev:server

# frontend only
npm run dev:client

# full development
# terminal 1
npm run dev:server
# terminal 2
npm run dev

# production-style local run
npm run build
npm start
```

## Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | Vue 3, Vue Router, Pinia, Tailwind  |
| Charts   | D3.js                               |
| Backend  | Node.js + Express.js                |
| Database | SQLite (better-sqlite3)             |
| Auth     | JWT + bcrypt                        |
| New Tech | OpenAI text-embedding-3-small       |
| Movie Data | TMDB API                          |
