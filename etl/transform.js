import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { STATES, detectUSState, extractPostHashtags } from './us-locations.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const DEFAULT_AFINN_PATH = path.join(__dirname, 'AFINN-111.txt');

// Matches Python's `string.punctuation`
const ASCII_PUNCTUATION_REGEX = /[!"#$%&'()*+,-./:;<=>?@[\\\]^_`{|}~]/g;

/**
 * Generates a 24-character hex string matching MongoDB ObjectId format
 * (4-byte Unix timestamp in seconds + 8 random bytes).
 *
 * @param {Date} [date=new Date()]
 * @returns {string}
 */
export function generateObjectId(date = new Date()) {
    const timestampHex = Math.floor(date.getTime() / 1000)
        .toString(16)
        .padStart(8, '0');
    const randomHex = crypto.randomBytes(8).toString('hex');
    return `${timestampHex}${randomHex}`;
}

/**
 * Loads AFINN-111 tab-delimited sentiment lexicon into a Map<string, number>.
 *
 * @param {string} [afinnPath=DEFAULT_AFINN_PATH]
 * @returns {Map<string, number>}
 */
export function loadAfinnScores(afinnPath = DEFAULT_AFINN_PATH) {
    const content = fs.readFileSync(afinnPath, 'utf8');
    const scores = new Map();

    for (const rawLine of content.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line) continue;
        const tabIdx = line.lastIndexOf('\t');
        if (tabIdx === -1) continue;
        const term = line.slice(0, tabIdx).trim().toLowerCase();
        const score = Number.parseInt(line.slice(tabIdx + 1).trim(), 10);
        if (term && !Number.isNaN(score)) {
            scores.set(term, score);
        }
    }

    return scores;
}

/**
 * Scores a post's text using the AFINN-111 lexicon (matching happiest_state.py).
 *
 * @param {string} text
 * @param {Map<string, number>} afinnScores
 * @returns {number}
 */
export function scoreText(text, afinnScores) {
    if (!text || typeof text !== 'string') {
        return 0;
    }

    const noPunct = text.replace(ASCII_PUNCTUATION_REGEX, '');
    const words = noPunct.trim().split(/\s+/);
    let score = 0;

    for (const word of words) {
        if (!word) continue;
        const lower = word.toLowerCase();
        if (afinnScores.has(lower)) {
            score += afinnScores.get(lower);
        }
    }

    return score;
}

/**
 * Maps a state's 1-based happiness rank to the DataMaps fillKey used by the frontend.
 *
 * @param {number} rank
 * @returns {'TOP' | 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN'}
 */
export function getFillKeyForRank(rank) {
    if (rank === 1) return 'TOP';
    if (rank >= 2 && rank <= 10) return 'HIGH';
    if (rank >= 11 && rank <= 25) return 'MEDIUM';
    if (rank >= 26 && rank <= 51) return 'LOW';
    return 'UNKNOWN';
}

/**
 * Computes the top N hashtags across an array of posts.
 *
 * @param {object[]} posts
 * @param {number} [limit=10]
 * @returns {Array<{ count: number, hashtag: string }>}
 */
export function computeTopHashtags(posts, limit = 10) {
    const counts = new Map();

    for (const post of posts) {
        const record = post?.commit?.record ?? post?.record ?? post;
        if (Array.isArray(record?.langs) && record.langs.length > 0) {
            const hasEnglish = record.langs.some(
                (l) => typeof l === 'string' && l.toLowerCase().startsWith('en')
            );
            if (!hasEnglish) continue;
        }
        // Skip posts self-labeled with adult/NSFW content labels on Bluesky
        if (Array.isArray(record?.labels?.values) && record.labels.values.length > 0) {
            continue;
        }

        const tags = extractPostHashtags(post);
        for (const tag of tags) {
            counts.set(tag, (counts.get(tag) || 0) + 1);
        }
    }

    return Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([hashtag, count]) => ({ count, hashtag }));
}

/**
 * Reads a newline-delimited JSON (.jsonl / .json) file of posts into an array of objects.
 *
 * @param {string} filePath
 * @returns {object[]}
 */
export function readPostsFromJsonl(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const posts = [];
    for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
            posts.push(JSON.parse(trimmed));
        } catch {
            // Skip malformed JSON line (matches original happiest_state.py behavior)
        }
    }
    return posts;
}

/**
 * Transforms an array of raw Bluesky (or Twitter) posts into `happiest_states` and `happiest_times`
 * snapshot records matching the exact schema expected by housty-api and housty-home-react.
 *
 * @param {object[]} posts
 * @param {object} [options]
 * @param {string} [options.afinnPath=DEFAULT_AFINN_PATH]
 * @param {Map<string, number>} [options.afinnScores]
 * @param {string} [options.fileName='bsky_output.jsonl']
 * @param {Date} [options.parseDate=new Date()]
 * @returns {{
 *   stateRecord: object,
 *   timeRecord: { _id: string, parseDate: string, score: number },
 *   stats: {
 *     totalPosts: number,
 *     locatedPosts: number,
 *     statesWithData: number,
 *     totalScore: number,
 *     happiestState: { state: string, score: number } | null
 *   }
 * }}
 */
export function transformPostsToSnapshot(posts, options = {}) {
    const {
        afinnPath = DEFAULT_AFINN_PATH,
        afinnScores = loadAfinnScores(afinnPath),
        fileName = 'bsky_output.jsonl',
        source = 'bluesky',
        parseDate = new Date()
    } = options;

    const stateHappiness = new Map();
    let locatedPosts = 0;

    for (const post of posts) {
        const state = detectUSState(post);
        if (!state) continue;

        locatedPosts += 1;
        const record = post?.commit?.record ?? post?.record ?? post;
        const text = record?.text ?? post?.text ?? '';
        const postScore = scoreText(text, afinnScores);

        stateHappiness.set(state, (stateHappiness.get(state) || 0) + postScore);
    }

    const isoDate = parseDate instanceof Date ? parseDate.toISOString() : String(parseDate);
    const stateRecord = {
        _id: generateObjectId(new Date(isoDate))
    };

    // Initialize all 59 US states & territories with default NA / UNKNOWN values
    for (const state of STATES) {
        stateRecord[state] = {
            score: 'NA',
            rank: 'NA',
            fillKey: 'UNKNOWN'
        };
    }

    stateRecord.parseDate = isoDate;
    stateRecord.fileName = path.basename(fileName);
    stateRecord.source = source;
    stateRecord.hashtags = computeTopHashtags(posts, 10);

    // Sort states with data by score descending
    const sortedStates = Array.from(stateHappiness.entries()).sort((a, b) => b[1] - a[1]);

    let rank = 1;
    let totalScore = 0;
    for (const [state, score] of sortedStates) {
        stateRecord[state] = {
            score,
            rank,
            fillKey: getFillKeyForRank(rank)
        };
        totalScore += score;
        rank += 1;
    }

    const timeRecord = {
        _id: generateObjectId(new Date(isoDate)),
        parseDate: isoDate,
        score: totalScore,
        source
    };

    const happiestState =
        sortedStates.length > 0
            ? { state: sortedStates[0][0], score: sortedStates[0][1] }
            : null;

    return {
        stateRecord,
        timeRecord,
        stats: {
            totalPosts: posts.length,
            locatedPosts,
            statesWithData: sortedStates.length,
            totalScore,
            happiestState
        }
    };
}
