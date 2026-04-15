CineMatch - Run Instructions

Overview
- CineMatch is a full-stack web app with:
- Express backend on port 3000 by default
- Vue/Vite frontend for development on port 5173
- SQLite database created automatically on first server start

Requirements
- Node.js 18+ recommended
- npm
- TMDB API key
- OpenAI API key

Setup
1. Open a terminal in the project root.
2. Install backend dependencies:
   npm install
3. Install frontend dependencies:
   npm --prefix client install
4. Copy .env.example to .env and fill in the required values:
   TMDB_API_KEY=your_tmdb_api_key_here
   OPENAI_API_KEY=your_openai_api_key_here
   JWT_SECRET=your_jwt_secret_here
   CLIENT_ORIGIN=http://localhost:5173
   PORT=3000

Development Mode
- Run the backend in one terminal:
  npm run dev:server
- Run the frontend in a second terminal:
  npm run dev
- Open the app in a browser:
  http://localhost:5173

Production-Style Local Run
- Build the Vue frontend:
  npm run build
- Start the Express server:
  npm start
- Open the app in a browser:
  http://localhost:3000

What the scripts do
- npm run dev:server
  Starts the Express server with nodemon so backend changes restart automatically.
- npm run dev
  Alias for npm run dev:client.
- npm run dev:client
  Starts the Vite development server for the Vue frontend.
- npm run build
  Builds the Vue frontend into client/dist for production use.
- npm start
  Starts the Express server in normal mode. If client/dist exists, Express serves the built frontend and handles SPA routes.

Example usage
- Backend development only:
  npm run dev:server
- Frontend development only:
  npm run dev:client
- Full local development:
  Terminal 1: npm run dev:server
  Terminal 2: npm run dev
- Production-style smoke test:
  npm run build
  npm start

Notes
- The database file is created automatically in server/db/cinematch.db.
- The built frontend is served by Express only after npm run build has been run.
- If port 3000 or 5173 is already in use, change the port value or stop the conflicting process.
