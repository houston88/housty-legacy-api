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
            doc_json TEXT NOT NULL
        );
        CREATE INDEX idx_happiest_states_parseDate ON happiest_states(parseDate);

        CREATE TABLE happiest_times (
            _id TEXT PRIMARY KEY,
            parseDate TEXT NOT NULL,
            score REAL NOT NULL
        );
        CREATE INDEX idx_happiest_times_parseDate ON happiest_times(parseDate);

        CREATE TABLE things (
            _id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            info TEXT,
            awesomeness INTEGER NOT NULL CHECK (awesomeness >= 1 AND awesomeness <= 10)
        );
    `);

    const statesPath = path.join(dataDir, 'happiest_states.json');
    const timesPath = path.join(dataDir, 'happiest_times.json');

    const statesData = JSON.parse(fs.readFileSync(statesPath, 'utf8'));
    const timesData = JSON.parse(fs.readFileSync(timesPath, 'utf8'));

    const insertState = db.prepare(
        'INSERT INTO happiest_states (_id, parseDate, fileName, doc_json) VALUES (?, ?, ?, ?)'
    );
    const insertTime = db.prepare(
        'INSERT INTO happiest_times (_id, parseDate, score) VALUES (?, ?, ?)'
    );
    const insertThing = db.prepare(
        'INSERT INTO things (_id, name, info, awesomeness) VALUES (?, ?, ?, ?)'
    );

    db.exec('BEGIN TRANSACTION');
    try {
        for (const doc of statesData) {
            insertState.run(
                String(doc._id),
                String(doc.parseDate),
                doc.fileName ?? null,
                JSON.stringify(doc)
            );
        }

        for (const doc of timesData) {
            insertTime.run(
                String(doc._id),
                String(doc.parseDate),
                Number(doc.score)
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

