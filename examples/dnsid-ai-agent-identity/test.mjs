import test from 'node:test';
import assert from 'node:assert/strict';
import {createLabBundle, verifyLabBundle} from './dnsid-lab.mjs';

test('accepts a complete signed lab bundle', () => {
  const now = new Date('2026-07-15T19:30:00Z');
  assert.equal(verifyLabBundle(createLabBundle({now}), {now}).ok, true);
});

test('rejects a modified TXT record', () => {
  const now = new Date('2026-07-15T19:30:00Z');
  const bundle = createLabBundle({now});
  bundle.record = bundle.record.replace('ka=24h', 'ka=90d');
  assert.throws(() => verifyLabBundle(bundle, {now}), /record signature failed/);
});

test('rejects duplicate tags', () => {
  const now = new Date('2026-07-15T19:30:00Z');
  const bundle = createLabBundle({now});
  bundle.record = bundle.record.replace(';gi=', ';gi=evil.example;gi=');
  assert.throws(() => verifyLabBundle(bundle, {now}), /duplicate tag/);
});

test('rejects stale status', () => {
  const now = new Date('2026-07-15T19:30:00Z');
  const bundle = createLabBundle({now});
  bundle.status.retrievedAt = '2026-07-15T19:20:00Z';
  assert.throws(() => verifyLabBundle(bundle, {now}), /status is not fresh ACTIVE/);
});

test('accepts a long-lived ACTIVE state when the response is fresh', () => {
  const issued = new Date('2026-07-15T09:30:00Z');
  const now = new Date('2026-07-15T19:30:00Z');
  const bundle = createLabBundle({now: issued});
  bundle.status.retrievedAt = now.toISOString();
  assert.equal(verifyLabBundle(bundle, {now}).ok, true);
});

test('rejects an operational key older than ka', () => {
  const issued = new Date('2026-07-14T18:30:00Z');
  const now = new Date('2026-07-15T19:30:00Z');
  const bundle = createLabBundle({now: issued});
  bundle.status.retrievedAt = now.toISOString();
  assert.throws(() => verifyLabBundle(bundle, {now}), /operational key exceeds ka limit/);
});

test('rejects non-ASCII tag data', () => {
  const now = new Date('2026-07-15T19:30:00Z');
  const bundle = createLabBundle({now});
  bundle.record = bundle.record.replace('gi=billing', 'gi=bílling');
  assert.throws(() => verifyLabBundle(bundle, {now}), /printable ASCII/);
});

test('rejects a substituted operational key', () => {
  const now = new Date('2026-07-15T19:30:00Z');
  const bundle = createLabBundle({now});
  const other = createLabBundle({now});
  bundle.operationalJwks = other.operationalJwks;
  assert.throws(() => verifyLabBundle(bundle, {now}), /current keys do not match ISSUANCE/);
});
