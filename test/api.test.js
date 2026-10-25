import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/index.js';

let server;
let baseUrl;

before(async () => {
    await new Promise((resolve) => {
        server = app.listen(0, () => {
            const { port } = server.address();
            baseUrl = `http://127.0.0.1:${port}`;
            resolve();
        });
    });
});

after(async () => {
    if (server) {
        await new Promise((resolve) => server.close(resolve));
    }
});

test('GET /api/health returns database counts and Node 24 engine info', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, 'ok');
    assert.ok(body.happiestStatesCount >= 809);
    assert.ok(body.happiestTimesCount >= 816);
    assert.equal(body.statesBySource.twitter, 809);
    assert.equal(body.timesBySource.twitter, 816);
});

test('GET /api/happiestStates returns sorted summary records with _id, parseDate, fileName, source', async () => {
    const res = await fetch(`${baseUrl}/api/happiestStates`);
    assert.equal(res.status, 200);
    const states = await res.json();
    assert.ok(states.length >= 809);
    assert.ok(states[0]._id);
    assert.ok(states[0].parseDate);
    assert.ok(states[0].fileName);
    assert.equal(states[0].source, 'twitter');
    // Should only select summary fields
    assert.equal(states[0].WA, undefined);
    // Verify ascending sort order
    assert.ok(states[0].parseDate <= states[states.length - 1].parseDate);
});

test('GET /api/happiestStates/:id returns full state details and hashtags in a 1-element array', async () => {
    const listRes = await fetch(`${baseUrl}/api/happiestStates`);
    const states = await listRes.json();
    const latestId = states[states.length - 1]._id;

    const detailRes = await fetch(`${baseUrl}/api/happiestStates/${latestId}`);
    assert.equal(detailRes.status, 200);
    const detailArr = await detailRes.json();
    assert.equal(Array.isArray(detailArr), true);
    assert.equal(detailArr.length, 1);
    const detail = detailArr[0];
    assert.equal(detail._id, latestId);
    assert.ok(detail.source === 'twitter' || detail.source === 'bluesky');
    assert.ok(detail.CA);
    assert.equal(typeof detail.CA.score, 'number');
    assert.ok(Array.isArray(detail.hashtags));
    assert.ok(detail.hashtags.length > 0);
});

test('GET /api/happiestTimes returns sorted historical happiness scores with source', async () => {
    const res = await fetch(`${baseUrl}/api/happiestTimes`);
    assert.equal(res.status, 200);
    const times = await res.json();
    assert.ok(times.length >= 816);
    assert.ok(times[0]._id);
    assert.ok(times[0].parseDate);
    assert.equal(typeof times[0].score, 'number');
    assert.equal(times[0].source, 'twitter');
    assert.ok(times[0].parseDate <= times[times.length - 1].parseDate);
});

test('GET /api/awesomeThings returns seeded things', async () => {
    const res = await fetch(`${baseUrl}/api/awesomeThings`);
    assert.equal(res.status, 200);
    const things = await res.json();
    assert.equal(things.length, 5);
    assert.ok(things[0].name);
});

