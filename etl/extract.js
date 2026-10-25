import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { detectUSState } from './us-locations.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const DEFAULT_JETSTREAM_URLS = [
    'wss://jetstream2.us-east.bsky.network/subscribe?wantedCollections=app.bsky.feed.post',
    'wss://jetstream1.us-east.bsky.network/subscribe?wantedCollections=app.bsky.feed.post',
    'wss://jetstream2.us-west.bsky.network/subscribe?wantedCollections=app.bsky.feed.post'
];

export const DEFAULT_OUTPUT_FILE = path.join(__dirname, 'bsky_output.jsonl');
const BSKY_PROFILES_ENDPOINT = 'https://public.api.bsky.app/xrpc/app.bsky.actor.getProfiles';

/**
 * Fetches Bluesky author profiles in batches of up to 25 DIDs to check their bio/location.
 *
 * @param {string[]} dids
 * @param {number} [maxBatches=16] - Cap number of HTTP batch calls per collection run (16 * 25 = 400 authors)
 * @returns {Promise<Map<string, { did: string, handle: string, displayName: string, description: string }>>}
 */
export async function fetchAuthorProfiles(dids, maxBatches = 16) {
    const profileMap = new Map();
    const uniqueDids = Array.from(new Set(dids)).slice(0, maxBatches * 25);
    const batches = [];

    for (let i = 0; i < uniqueDids.length; i += 25) {
        batches.push(uniqueDids.slice(i, i + 25));
    }

    const CONCURRENCY = 4;
    for (let i = 0; i < batches.length; i += CONCURRENCY) {
        const chunk = batches.slice(i, i + CONCURRENCY);
        await Promise.all(
            chunk.map(async (batch) => {
                const params = new URLSearchParams();
                for (const did of batch) {
                    params.append('actors', did);
                }

                try {
                    const res = await fetch(`${BSKY_PROFILES_ENDPOINT}?${params.toString()}`, {
                        headers: { Accept: 'application/json' },
                        signal: AbortSignal.timeout(5000)
                    });
                    if (!res.ok) return;
                    const data = await res.json();
                    if (Array.isArray(data?.profiles)) {
                        for (const p of data.profiles) {
                            if (p?.did) {
                                profileMap.set(p.did, {
                                    did: p.did,
                                    handle: p.handle || '',
                                    displayName: p.displayName || '',
                                    description: p.description || ''
                                });
                            }
                        }
                    }
                } catch {
                    // Ignore transient profile lookup errors
                }
            })
        );
    }

    return profileMap;
}

/**
 * Connects to Bluesky Jetstream WebSocket firehose and collects post create events.
 *
 * @param {object} [options]
 * @param {number} [options.durationSeconds=600] - How long to stream posts in seconds (default 10 minutes)
 * @param {number} [options.maxPosts=Infinity] - Optional maximum number of posts to collect before stopping early
 * @param {string} [options.outputPath] - Path to write newline-delimited JSON posts
 * @param {boolean} [options.enrichProfiles=true] - Whether to batch-lookup author bios for posts without inline state mentions
 * @param {number} [options.maxProfileBatches=40] - Max batches of 25 author profiles to look up
 * @param {string[]} [options.jetstreamUrls] - Override Jetstream WebSocket endpoints
 * @param {(stats: { totalPosts: number, elapsedMs: number }) => void} [options.onProgress]
 * @returns {Promise<{ posts: object[], outputPath: string, totalPosts: number, elapsedMs: number }>}
 */
export async function extractBlueskyStream(options = {}) {
    const {
        durationSeconds = 600,
        maxPosts = Infinity,
        outputPath = DEFAULT_OUTPUT_FILE,
        enrichProfiles = true,
        maxProfileBatches = 40,
        jetstreamUrls = DEFAULT_JETSTREAM_URLS,
        onProgress
    } = options;

    const posts = [];
    const startTime = performance.now();

    await new Promise((resolve, reject) => {
        let urlIndex = 0;
        let ws = null;
        let finished = false;
        let timer = null;
        let progressInterval = null;

        const finish = (err) => {
            if (finished) return;
            finished = true;
            if (timer) clearTimeout(timer);
            if (progressInterval) clearInterval(progressInterval);
            if (ws) {
                try {
                    ws.close();
                } catch {
                    // ignore close errors
                }
            }
            if (err) reject(err);
            else resolve();
        };

        const connect = () => {
            const url = jetstreamUrls[urlIndex];
            ws = new WebSocket(url);

            ws.onmessage = (event) => {
                if (finished) return;
                try {
                    const data = JSON.parse(String(event.data));
                    if (
                        data?.kind === 'commit' &&
                        data?.commit?.operation === 'create' &&
                        data?.commit?.collection === 'app.bsky.feed.post' &&
                        data?.commit?.record?.text
                    ) {
                        posts.push(data);
                        if (posts.length >= maxPosts) {
                            finish();
                        }
                    }
                } catch {
                    // Ignore malformed messages
                }
            };

            ws.onerror = () => {
                if (finished) return;
                if (urlIndex + 1 < jetstreamUrls.length) {
                    urlIndex += 1;
                    connect();
                } else {
                    finish(new Error('Failed to connect to any Bluesky Jetstream endpoint.'));
                }
            };

            ws.onclose = () => {
                if (!finished) {
                    urlIndex = (urlIndex + 1) % jetstreamUrls.length;
                    setTimeout(() => {
                        if (!finished) connect();
                    }, 500);
                }
            };
        };

        timer = setTimeout(() => {
            finish();
        }, durationSeconds * 1000);

        if (typeof onProgress === 'function') {
            progressInterval = setInterval(() => {
                onProgress({
                    totalPosts: posts.length,
                    elapsedMs: Math.round(performance.now() - startTime)
                });
            }, 15000);
        }

        connect();
    });

    // Optional enrichment: batch-fetch author bios for English posts that didn't match a state in post text
    if (enrichProfiles && posts.length > 0 && maxProfileBatches > 0) {
        const candidateDids = [];
        for (const post of posts) {
            const record = post?.commit?.record;
            const langs = record?.langs;
            const isEnglish =
                !Array.isArray(langs) ||
                langs.length === 0 ||
                langs.some((l) => typeof l === 'string' && l.toLowerCase().startsWith('en'));

            if (isEnglish && post.did && !detectUSState(post)) {
                candidateDids.push(post.did);
            }
        }

        if (candidateDids.length > 0) {
            const profileMap = await fetchAuthorProfiles(candidateDids, maxProfileBatches);
            for (const post of posts) {
                if (post.did && profileMap.has(post.did)) {
                    post.authorProfile = profileMap.get(post.did);
                }
            }
        }
    }

    if (outputPath) {
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        const lines = posts.map((p) => JSON.stringify(p)).join('\n') + (posts.length ? '\n' : '');
        fs.writeFileSync(outputPath, lines, 'utf8');
    }

    const elapsedMs = Math.round(performance.now() - startTime);
    return {
        posts,
        outputPath,
        totalPosts: posts.length,
        elapsedMs
    };
}

// Allow running standalone: `node etl/extract.js [--duration 600] [--output etl/bsky_output.jsonl]`
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
    const args = process.argv.slice(2);
    let durationSeconds = 600;
    let outputPath = DEFAULT_OUTPUT_FILE;

    for (let i = 0; i < args.length; i++) {
        if ((args[i] === '--duration' || args[i] === '-d') && args[i + 1]) {
            durationSeconds = Number(args[++i]);
        } else if ((args[i] === '--output' || args[i] === '-o') && args[i + 1]) {
            outputPath = path.resolve(args[++i]);
        }
    }

    console.log(`Streaming Bluesky Jetstream for ${durationSeconds}s -> ${outputPath}...`);
    extractBlueskyStream({
        durationSeconds,
        outputPath,
        onProgress: ({ totalPosts, elapsedMs }) => {
            console.log(`  [${(elapsedMs / 1000).toFixed(0)}s] Collected ${totalPosts} posts...`);
        }
    })
        .then(({ totalPosts, elapsedMs }) => {
            console.log(`Done! Saved ${totalPosts} Bluesky posts in ${(elapsedMs / 1000).toFixed(1)}s.`);
        })
        .catch((err) => {
            console.error('Extract failed:', err);
            process.exit(1);
        });
}
