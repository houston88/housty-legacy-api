import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_DATA_DIR = path.resolve(__dirname, '../data');

let dbInstance = null;

const DEFAULT_THINGS = [
    {
        _id: '1',
        name: 'HTML5 Boilerplate',
        info: 'HTML5 Boilerplate is a professional front-end template for building fast, robust, and adaptable web apps or sites.',
        awesomeness: 10
    },
    {
        _id: '2',
        name: 'AngularJS',
        info: 'AngularJS is a toolset for building the framework most suited to your application development.',
        awesomeness: 10
    },
    {
        _id: '3',
        name: 'Karma',
        info: 'Spectacular Test Runner for JavaScript.',
        awesomeness: 10
    },
    {
        _id: '4',
        name: 'Express',
        info: 'Flexible and minimalist web application framework for node.js.',
        awesomeness: 10
    },
    {
        _id: '5',
        name: 'Node.js 24 + node:sqlite',
        info: 'Built-in in-memory SQLite database auto-loaded from historical Twitter data files.',
        awesomeness: 10
    }
];

/**
 * Initializes the in-memory SQLite database and auto-loads JSON seed files.
 * @param {string} [dataDir] - Directory containing happiest_states.json and happiest_times.json
 * @returns {DatabaseSync}
 */
export function initDb(dataDir = DEFAULT_DATA_DIR) {
    if (dbInstance) {
        return dbInstance;
    }

    const db = new DatabaseSync(':memory:');

    db.exec(`
        CREATE TABLE happiest_states (
            _id TEXT PRIMARY KEY,
            parseDate TEXT NOT NULL,
            fileName TEXT,
            source TEXT NOT NULL DEFAULT 'twitter',
            doc_json TEXT NOT NULL
        );
        CREATE INDEX idx_happiest_states_parseDate ON happiest_states(parseDate);
        CREATE INDEX idx_happiest_states_source ON happiest_states(source);

        CREATE TABLE happiest_times (
            _id TEXT PRIMARY KEY,
            parseDate TEXT NOT NULL,
            score REAL NOT NULL,
            source TEXT NOT NULL DEFAULT 'twitter'
        );
        CREATE INDEX idx_happiest_times_parseDate ON happiest_times(parseDate);
        CREATE INDEX idx_happiest_times_source ON happiest_times(source);

        CREATE TABLE things (
            _id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            info TEXT,
            awesomeness INTEGER NOT NULL CHECK (awesomeness >= 1 AND awesomeness <= 10)
        );
    `);

    const statesPath = path.join(dataDir, 'happiest_states.json');
    const timesPath = path.join(dataDir, 'happiest_times.json');
    const historyPath = path.join(dataDir, 'bluesky_history.json');

    const statesData = JSON.parse(fs.readFileSync(statesPath, 'utf8'));
    const timesData = JSON.parse(fs.readFileSync(timesPath, 'utf8'));

    // Merge any droplet-collected Bluesky snapshots from bluesky_history.json not yet in seed files
    if (fs.existsSync(historyPath)) {
        try {
            const historyEntries = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
            const existingStateIds = new Set(statesData.map((d) => String(d._id)));
            const existingTimeIds = new Set(timesData.map((d) => String(d._id)));
            let merged = false;

            for (const entry of historyEntries) {
                if (entry?.stateRecord && !existingStateIds.has(String(entry.stateRecord._id))) {
                    statesData.push(entry.stateRecord);
                    existingStateIds.add(String(entry.stateRecord._id));
                    merged = true;
                }
                if (entry?.timeRecord && !existingTimeIds.has(String(entry.timeRecord._id))) {
                    timesData.push(entry.timeRecord);
                    existingTimeIds.add(String(entry.timeRecord._id));
                    merged = true;
                }
            }

            if (merged) {
                fs.writeFileSync(statesPath, JSON.stringify(statesData) + '\n', 'utf8');
                fs.writeFileSync(timesPath, JSON.stringify(timesData) + '\n', 'utf8');
            }
        } catch {
            // Ignore malformed history file
        }
    }

    const insertState = db.prepare(
        'INSERT INTO happiest_states (_id, parseDate, fileName, source, doc_json) VALUES (?, ?, ?, ?, ?)'
    );
    const insertTime = db.prepare(
        'INSERT INTO happiest_times (_id, parseDate, score, source) VALUES (?, ?, ?, ?)'
    );
    const insertThing = db.prepare(
        'INSERT INTO things (_id, name, info, awesomeness) VALUES (?, ?, ?, ?)'
    );

    db.exec('BEGIN TRANSACTION');
    try {
        for (const doc of statesData) {
            const source =
                doc.source ||
                (typeof doc.fileName === 'string' && doc.fileName.startsWith('bsky')
                    ? 'bluesky'
                    : 'twitter');
            const normalizedDoc = doc.source ? doc : { ...doc, source };
            insertState.run(
                String(doc._id),
                String(doc.parseDate),
                doc.fileName ?? null,
                String(source),
                JSON.stringify(normalizedDoc)
            );
        }

        for (const doc of timesData) {
            const source = doc.source || 'twitter';
            insertTime.run(
                String(doc._id),
                String(doc.parseDate),
                Number(doc.score),
                String(source)
            );
        }

        for (const thing of DEFAULT_THINGS) {
            insertThing.run(thing._id, thing.name, thing.info, thing.awesomeness);
        }

        db.exec('COMMIT');
    } catch (err) {
        db.exec('ROLLBACK');
        throw err;
    }

    dbInstance = db;
    return dbInstance;
}

export function getDb() {
    if (!dbInstance) {
        return initDb();
    }
    return dbInstance;
}

