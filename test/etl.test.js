import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
    STATES,
    detectStateInText,
    detectUSState,
    extractPostHashtags
} from '../etl/us-locations.js';
import {
    loadAfinnScores,
    scoreText,
    transformPostsToSnapshot
} from '../etl/transform.js';
import {
    ensureTwitterBackup,
    loadSnapshotToDataFiles
} from '../etl/load.js';

test('loadAfinnScores loads AFINN-111 lexicon and scoreText computes expected sentiment', () => {
    const scores = loadAfinnScores();
    assert.ok(scores.size > 2400);
    assert.equal(scores.get('happy'), 3);
    assert.equal(scores.get('sad'), -2);

    const positiveScore = scoreText('So happy and wonderful today!', scores);
    assert.equal(positiveScore, 3 + 4); // happy (3) + wonderful (4)

    const negativeScore = scoreText('Terrible, awful accident...', scores);
    assert.equal(negativeScore, -3 + -3 + -2); // terrible (-3) + awful (-3) + accident (-2)
});

test('detectUSState detects state from City, ST, hashtags, major cities, state names, and author bio', () => {
    // 1. City, ST pattern
    assert.equal(detectStateInText('Sunny morning here in Austin, TX!'), 'TX');

    // 2. Major city mention
    assert.equal(
        detectUSState({
            commit: {
                record: {
                    text: 'Grabbing coffee in Seattle before work',
                    langs: ['en']
                }
            }
        }),
        'WA'
    );

    // 3. Hashtag facet
    assert.equal(
        detectUSState({
            commit: {
                record: {
                    text: 'Big game tonight!',
                    langs: ['en'],
                    facets: [
                        {
                            features: [
                                {
                                    $type: 'app.bsky.richtext.facet#tag',
                                    tag: 'NYC'
                                }
                            ]
                        }
                    ]
                }
            }
        }),
        'NY'
    );

    // 4. Author bio enrichment fallback
    assert.equal(
        detectUSState({
            commit: {
                record: {
                    text: 'What a great day outside!',
                    langs: ['en']
                }
            },
            authorProfile: {
                displayName: 'Jane',
                description: 'Software engineer | 📍 Denver, CO'
            }
        }),
        'CO'
    );

    // 5. Non-English posts are ignored
    assert.equal(
        detectUSState({
            commit: {
                record: {
                    text: 'Visiting California',
                    langs: ['ja']
                }
            }
        }),
        null
    );
});

test('extractPostHashtags extracts lowercase tags from Bluesky facets and inline text', () => {
    const tags = extractPostHashtags({
        commit: {
            record: {
                text: 'Loving #Bluesky and #NodeJS',
                facets: [
                    {
                        features: [
                            { $type: 'app.bsky.richtext.facet#tag', tag: 'Bluesky' },
                            { $type: 'app.bsky.richtext.facet#tag', tag: 'NodeJS' }
                        ]
                    }
                ]
            }
        }
    });
    assert.deepEqual(tags, ['bluesky', 'nodejs']);
});

test('transformPostsToSnapshot ranks states, computes totalScore, and matches API schema', () => {
    const samplePosts = [
        {
            commit: {
                record: {
                    text: 'Awesome wonderful happy day in Los Angeles, CA! #California #Sunshine',
                    langs: ['en']
                }
            }
        },
        {
            commit: {
                record: {
                    text: 'Good morning from Seattle, WA #PNW #Sunshine',
                    langs: ['en']
                }
            }
        },
        {
            commit: {
                record: {
                    text: 'Terrible traffic in New York City today #NYC',
                    langs: ['en']
                }
            }
        }
    ];

    const { stateRecord, timeRecord, stats } = transformPostsToSnapshot(samplePosts, {
        fileName: 'bsky_output.jsonl'
    });

    assert.equal(stats.totalPosts, 3);
    assert.equal(stats.locatedPosts, 3);
    assert.equal(stats.statesWithData, 3);

    // Verify all 59 states exist on stateRecord
    for (const st of STATES) {
        assert.ok(stateRecord[st], `Missing state key ${st}`);
    }

    // CA should be rank 1 (TOP), WA rank 2 (HIGH), NY rank 3 (HIGH)
    assert.equal(stateRecord.CA.rank, 1);
    assert.equal(stateRecord.CA.fillKey, 'TOP');
    assert.ok(stateRecord.CA.score > stateRecord.WA.score);

    assert.equal(stateRecord.WA.rank, 2);
    assert.equal(stateRecord.WA.fillKey, 'HIGH');

    assert.equal(stateRecord.NY.rank, 3);
    assert.equal(stateRecord.NY.fillKey, 'HIGH');
    assert.ok(stateRecord.NY.score < 0);

    // Unmatched state should have NA / UNKNOWN
    assert.deepEqual(stateRecord.WY, { score: 'NA', rank: 'NA', fillKey: 'UNKNOWN' });

    // Top hashtags should have sunshine (2) first
    assert.equal(stateRecord.hashtags[0].hashtag, 'sunshine');
    assert.equal(stateRecord.hashtags[0].count, 2);

    // timeRecord score equals sum of state scores
    const expectedTotal = stateRecord.CA.score + stateRecord.WA.score + stateRecord.NY.score;
    assert.equal(timeRecord.score, expectedTotal);
    assert.equal(timeRecord.parseDate, stateRecord.parseDate);
    assert.equal(stateRecord.source, 'bluesky');
    assert.equal(timeRecord.source, 'bluesky');
});

test('loadSnapshotToDataFiles backs up original Twitter data and appends new records', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'housty-etl-test-'));
    try {
        const initialStates = [{ _id: '111', parseDate: '2014-01-01T00:00:00.000Z' }];
        const initialTimes = [{ _id: '222', parseDate: '2014-01-01T00:00:00.000Z', score: 10 }];

        fs.writeFileSync(
            path.join(tmpDir, 'happiest_states.json'),
            JSON.stringify(initialStates),
            'utf8'
        );
        fs.writeFileSync(
            path.join(tmpDir, 'happiest_times.json'),
            JSON.stringify(initialTimes),
            'utf8'
        );

        const backupInfo = ensureTwitterBackup(tmpDir);
        assert.equal(backupInfo.created, true);
        assert.ok(fs.existsSync(backupInfo.statesBackupPath));
        assert.ok(fs.existsSync(backupInfo.timesBackupPath));

        const { stateRecord, timeRecord } = transformPostsToSnapshot([
            {
                commit: {
                    record: {
                        text: 'Happy day in San Francisco, CA #BayArea',
                        langs: ['en']
                    }
                }
            }
        ]);

        const loadRes = loadSnapshotToDataFiles({ stateRecord, timeRecord }, { dataDir: tmpDir });
        assert.equal(loadRes.happiestStatesCount, 2);
        assert.equal(loadRes.happiestTimesCount, 2);

        // Verify backup still only has the 1 original Twitter record
        const backupStates = JSON.parse(fs.readFileSync(backupInfo.statesBackupPath, 'utf8'));
        assert.equal(backupStates.length, 1);
    } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    }
});
