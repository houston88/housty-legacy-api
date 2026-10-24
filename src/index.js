import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { initDb } from './db.js';
import apiRoutes from './routes/api.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize in-memory SQLite database from JSON seed files
const startTime = performance.now();
const db = initDb();
const { count: statesCount } = db.prepare('SELECT COUNT(*) AS count FROM happiest_states').get();
const { count: timesCount } = db.prepare('SELECT COUNT(*) AS count FROM happiest_times').get();
const elapsedMs = (performance.now() - startTime).toFixed(1);
console.log(
    `Initialized in-memory node:sqlite database in ${elapsedMs}ms (${statesCount} happiest_states, ${timesCount} happiest_times).`
);

// Routes
app.use('/api', apiRoutes);

// Start server if executed directly
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
    app.listen(PORT, () => {
        console.log(`Express server is running on port ${PORT}`);
    });
}

export default app;
