import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const DEFAULT_DATA_DIR = path.resolve(__dirname, '../data');

/**
 * Ensures the original Twitter-only JSON seed files are backed up in
 * `data/twitter_backup/` before appending any Bluesky snapshots.
 * Never overwrites an existing backup.
 *
 * @param {string} [dataDir=DEFAULT_DATA_DIR]
 * @returns {{ statesBackupPath: string, timesBackupPath: string, created: boolean }}
 */
export function ensureTwitterBackup(dataDir = DEFAULT_DATA_DIR) {
    const backupDir = path.join(dataDir, 'twitter_backup');
    const statesPath = path.join(dataDir, 'happiest_states.json');
    const timesPath = path.join(dataDir, 'happiest_times.json');
    const statesBackupPath = path.join(backupDir, 'happiest_states.json');
    const timesBackupPath = path.join(backupDir, 'happiest_times.json');

    fs.mkdirSync(backupDir, { recursive: true });

    let created = false;
    if (!fs.existsSync(statesBackupPath) && fs.existsSync(statesPath)) {
        fs.copyFileSync(statesPath, statesBackupPath);
        created = true;
    }
    if (!fs.existsSync(timesBackupPath) && fs.existsSync(timesPath)) {
        fs.copyFileSync(timesPath, timesBackupPath);
        created = true;
    }

    return { statesBackupPath, timesBackupPath, created };
}

/**
 * Appends a transformed snapshot (`stateRecord` and `timeRecord`) to
 * `data/happiest_states.json` and `data/happiest_times.json`.
 *
 * @param {{ stateRecord: object, timeRecord: object }} snapshot
 * @param {object} [options]
 * @param {string} [options.dataDir=DEFAULT_DATA_DIR]
 * @returns {{
 *   statesPath: string,
 *   timesPath: string,
 *   happiestStatesCount: number,
 *   happiestTimesCount: number
 * }}
 */
export function loadSnapshotToDataFiles(snapshot, options = {}) {
    const { dataDir = DEFAULT_DATA_DIR } = options;
    const { stateRecord, timeRecord } = snapshot;

    if (!stateRecord || !timeRecord) {
        throw new Error('Both stateRecord and timeRecord are required to load a snapshot.');
    }

    ensureTwitterBackup(dataDir);

    const statesPath = path.join(dataDir, 'happiest_states.json');
    const timesPath = path.join(dataDir, 'happiest_times.json');
    const historyPath = path.join(dataDir, 'bluesky_history.json');

    const statesData = JSON.parse(fs.readFileSync(statesPath, 'utf8'));
    const timesData = JSON.parse(fs.readFileSync(timesPath, 'utf8'));

    statesData.push(stateRecord);
    timesData.push(timeRecord);

    // Also persist to an untracked bluesky_history.json journal so droplet SCP deploys never lose daily runs
    let historyData = [];
    if (fs.existsSync(historyPath)) {
        try {
            historyData = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
        } catch {
            historyData = [];
        }
    }
    historyData.push({ stateRecord, timeRecord });

    // Write atomically via temporary files in the same directory
    const statesTmp = `${statesPath}.tmp`;
    const timesTmp = `${timesPath}.tmp`;
    const historyTmp = `${historyPath}.tmp`;

    fs.writeFileSync(statesTmp, JSON.stringify(statesData) + '\n', 'utf8');
    fs.renameSync(statesTmp, statesPath);

    fs.writeFileSync(timesTmp, JSON.stringify(timesData) + '\n', 'utf8');
    fs.renameSync(timesTmp, timesPath);

    fs.writeFileSync(historyTmp, JSON.stringify(historyData) + '\n', 'utf8');
    fs.renameSync(historyTmp, historyPath);

    return {
        statesPath,
        timesPath,
        happiestStatesCount: statesData.length,
        happiestTimesCount: timesData.length
    };
}
