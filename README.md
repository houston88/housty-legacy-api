# Housty API

Modernized Node.js 24 / Express 5 API that serves historical Twitter happiness data from a built-in in-memory `node:sqlite` (`DatabaseSync(':memory:')`) database auto-loaded from JSON seed files on startup.

## Prerequisites

- **Node.js** `>= 24.0.0` (uses the built-in `node:sqlite` module and `node:test` runner)
- **npm** `>= 11.0.0`

## Setup & Running Locally

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Environment Variables** (optional `.env` in project root):
   ```env
   PORT=8080
   ```

3. **Run in Development Mode** (with watch mode):
   ```bash
   npm run dev
   ```

4. **Run in Production Mode**:
   ```bash
   npm start
   ```

5. **Run Automated Tests**:
   ```bash
   npm test
   ```

## API Endpoints

- `GET /api/health` — Returns service health and record counts (`happiestStatesCount: 809`, `happiestTimesCount: 816`).
- `GET /api/happiestStates` — Returns sorted list of snapshot metadata (`_id`, `parseDate`, `fileName`).
- `GET /api/happiestStates/:id` — Returns full state-by-state scores/ranks and top hashtags for the given snapshot `_id`.
- `GET /api/happiestTimes` — Returns historical happiness scores over time (`_id`, `parseDate`, `score`).
- `GET /api/awesomeThings` — Legacy MEAN stack sample endpoint.
