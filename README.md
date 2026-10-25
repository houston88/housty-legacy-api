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

## Bluesky ETL Pipeline (`etl/`)

The `etl/` directory contains a Node.js 24 Extract-Transform-Load pipeline (ported from the original `twitterCalcs` Python scripts) that streams live public posts from the **Bluesky Jetstream** WebSocket firehose, scores sentiment using `AFINN-111.txt`, maps posts to US states, and appends new snapshots to `data/happiest_states.json` and `data/happiest_times.json`.

Original Twitter-only seed files are preserved in `data/twitter_backup/`.

- **Run ETL (default 600s / 10-minute stream collection)**:
  ```bash
  npm run etl
  ```
- **Run for a custom duration (e.g., 60s)**:
  ```bash
  node etl/index.js --duration 60
  ```
- **Dry-run (stream & score without modifying `data/*.json`)**:
  ```bash
  npm run etl:dry-run -- --duration 30
  ```
- **Re-process a saved `.jsonl` stream dump**:
  ```bash
  node etl/index.js --input etl/bsky_output.jsonl
  ```
- **Automated Daily Schedule (`deploy/`)**:
  - `deploy/housty-etl.timer` triggers `deploy/housty-etl.service` (`deploy/run-daily-etl.sh`) every day at `17:00:00` (5:00 PM) on the DigitalOcean droplet, runs the 10-minute BlueSky Jetstream ETL, and restarts `housty-api.service` to reload the in-memory SQLite database.
