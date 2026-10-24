import express from 'express';
import { getDb } from '../db.js';

const router = express.Router();

router.get('/health', (req, res) => {
    try {
        const db = getDb();
        const { count: happiestStatesCount } = db
            .prepare('SELECT COUNT(*) AS count FROM happiest_states')
            .get();
        const { count: happiestTimesCount } = db
            .prepare('SELECT COUNT(*) AS count FROM happiest_times')
            .get();

        res.json({
            status: 'ok',
            engine: 'node:sqlite (:memory:)',
            nodeVersion: process.version,
            happiestStatesCount,
            happiestTimesCount
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/awesomeThings', (req, res) => {
    try {
        const db = getDb();
        const things = db
            .prepare('SELECT _id, name, info, awesomeness FROM things')
            .all();
        res.json(things);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const happiestStatesHandler = (req, res) => {
    try {
        const db = getDb();
        if (req.params.id) {
            const row = db
                .prepare('SELECT doc_json FROM happiest_states WHERE _id = ?')
                .get(req.params.id);
            return res.json(row ? [JSON.parse(row.doc_json)] : []);
        }

        const states = db
            .prepare('SELECT _id, parseDate, fileName FROM happiest_states ORDER BY parseDate ASC')
            .all();
        res.json(states);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

router.get('/happiestStates', happiestStatesHandler);
router.get('/happiestStates/:id', happiestStatesHandler);

router.get('/happiestTimes', (req, res) => {
    try {
        const db = getDb();
        const times = db
            .prepare('SELECT _id, parseDate, score FROM happiest_times ORDER BY parseDate ASC')
            .all();
        res.json(times);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
