import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractBlueskyStream, DEFAULT_OUTPUT_FILE } from './extract.js';
import {
    transformPostsToSnapshot,
    readPostsFromJsonl,
    DEFAULT_AFINN_PATH
} from './transform.js';
import { loadSnapshotToDataFiles, DEFAULT_DATA_DIR } from './load.js';

const __filename = fileURLToPath(import.meta.url);

/**
 * Runs the full Bluesky Extract -> Transform -> Load pipeline.
 *
 * @param {object} [options]
 * @param {number} [options.durationSeconds=600] - Stream collection window in seconds (default 10m; ignored if inputPath is set)
 * @param {string} [options.inputPath] - Optional existing .jsonl file to transform instead of streaming live
 * @param {string} [options.outputPath=DEFAULT_OUTPUT_FILE] - Where to save raw streamed posts
 * @param {string} [options.afinnPath=DEFAULT_AFINN_PATH] - Path to AFINN-111.txt
 * @param {string} [options.dataDir=DEFAULT_DATA_DIR] - Directory containing happiest_states.json & happiest_times.json
 * @param {boolean} [options.dryRun=false] - If true, skips appending to data/*.json
 * @param {boolean} [options.enrichProfiles=true] - Whether to batch-lookup author profile bios
 * @returns {Promise<{
 *   stateRecord: object,
 *   timeRecord: object,
 *   stats: object,
 *   loadResult: object | null
 * }>}
 */
export async function runBlueskyEtl(options = {}) {
    const {
        durationSeconds = 600,
        inputPath = null,
        outputPath = DEFAULT_OUTPUT_FILE,
        afinnPath = DEFAULT_AFINN_PATH,
        dataDir = DEFAULT_DATA_DIR,
        dryRun = false,
        enrichProfiles = true
    } = options;

    let posts;
    let sourceFileName;

    if (inputPath) {
        const resolvedInput = path.resolve(inputPath);
        console.log(`[Extract] Reading existing posts from ${resolvedInput}...`);
        posts = readPostsFromJsonl(resolvedInput);
        sourceFileName = path.basename(resolvedInput);
        console.log(`[Extract] Loaded ${posts.length} posts from file.`);
    } else {
        console.log(
            `[Extract] Streaming Bluesky Jetstream for ${durationSeconds}s -> ${outputPath}...`
        );
        const extractResult = await extractBlueskyStream({
            durationSeconds,
            outputPath,
            enrichProfiles,
            onProgress: ({ totalPosts, elapsedMs }) => {
                console.log(
                    `  [${(elapsedMs / 1000).toFixed(0)}s] Collected ${totalPosts} posts...`
                );
            }
        });
        posts = extractResult.posts;
        sourceFileName = path.basename(outputPath);
        console.log(
            `[Extract] Finished collecting ${extractResult.totalPosts} posts in ${(
                extractResult.elapsedMs / 1000
            ).toFixed(1)}s.`
        );
    }

    console.log(`[Transform] Scoring posts with ${path.basename(afinnPath)}...`);
    const snapshot = transformPostsToSnapshot(posts, {
        afinnPath,
        fileName: sourceFileName
    });

    const { stateRecord, timeRecord, stats } = snapshot;
    console.log(
        `[Transform] Matched ${stats.locatedPosts} / ${stats.totalPosts} posts across ${stats.statesWithData} US states/territories.`
    );
    if (stats.happiestState) {
        console.log(
            `[Transform] Happiest state: ${stats.happiestState.state} (score: ${stats.happiestState.score})`
        );
    }
    console.log(`[Transform] Total stream happiness score: ${stats.totalScore}`);
    if (stateRecord.hashtags.length > 0) {
        console.log(
            `[Transform] Top hashtags: ${stateRecord.hashtags
                .map((h) => `#${h.hashtag} (${h.count})`)
                .join(', ')}`
        );
    }

    let loadResult = null;
    if (dryRun) {
        console.log('[Load] Dry-run enabled; skipping write to data/*.json.');
    } else {
        loadResult = loadSnapshotToDataFiles(snapshot, { dataDir });
        console.log(
            `[Load] Appended snapshot ${stateRecord._id} -> happiest_states.json (${loadResult.happiestStatesCount} records), happiest_times.json (${loadResult.happiestTimesCount} records).`
        );
    }

    return {
        stateRecord,
        timeRecord,
        stats,
        loadResult
    };
}

// CLI entry point: `node etl/index.js [--duration 600] [--input file.jsonl] [--dry-run]`
if (process.argv[1] && __filename === path.resolve(process.argv[1])) {
    const args = process.argv.slice(2);
    let durationSeconds = 600;
    let inputPath = null;
    let outputPath = DEFAULT_OUTPUT_FILE;
    let dryRun = false;

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if ((arg === '--duration' || arg === '-d') && args[i + 1]) {
            durationSeconds = Number(args[++i]);
        } else if ((arg === '--input' || arg === '-i') && args[i + 1]) {
            inputPath = args[++i];
        } else if ((arg === '--output' || arg === '-o') && args[i + 1]) {
            outputPath = path.resolve(args[++i]);
        } else if (arg === '--dry-run') {
            dryRun = true;
        }
    }

    runBlueskyEtl({
        durationSeconds,
        inputPath,
        outputPath,
        dryRun
    }).catch((err) => {
        console.error('Bluesky ETL failed:', err);
        process.exit(1);
    });
}
