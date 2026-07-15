import assert from 'node:assert/strict';
import test from 'node:test';
import { TaskStore, supportsTaskCall } from './task-store.mjs';

const alice = { subject: 'alice', tenant: 'acme' };
const bob = { subject: 'bob', tenant: 'acme' };
const otherTenant = { subject: 'alice', tenant: 'other' };

test('task augmentation requires global and tool-level support', () => {
  const capabilities = { tasks: { requests: { tools: { call: {} } } } };
  assert.equal(supportsTaskCall(capabilities, { execution: { taskSupport: 'optional' } }), true);
  assert.equal(supportsTaskCall({}, { execution: { taskSupport: 'optional' } }), false);
  assert.equal(supportsTaskCall(capabilities, {}), false);
});

test('create returns a pollable working task', () => {
  const task = new TaskStore().create({ owner: alice, ttl: 60_000, pollInterval: 2_000 });
  assert.equal(task.status, 'working');
  assert.equal(task.pollInterval, 2_000);
  assert.match(task.taskId, /^[0-9a-f-]{36}$/);
});

test('get rejects a different subject and tenant', () => {
  const store = new TaskStore();
  const task = store.create({ owner: alice });
  assert.throws(() => store.get(task.taskId, bob), /not found/);
  assert.throws(() => store.get(task.taskId, otherTenant), /not found/);
});

test('list only returns tasks in the authorization context', () => {
  const store = new TaskStore();
  store.create({ owner: alice });
  store.create({ owner: bob });
  assert.equal(store.list(alice).length, 1);
});

test('input_required can resume without creating a second task', () => {
  const store = new TaskStore();
  const task = store.create({ owner: alice });
  assert.equal(store.requireInput(task.taskId, alice, 'Choose a region').status, 'input_required');
  assert.equal(store.resume(task.taskId, alice).status, 'working');
});

test('completed result matches the wrapped tool result', () => {
  const store = new TaskStore();
  const task = store.create({ owner: alice });
  const result = { content: [{ type: 'text', text: 'done' }], isError: false };
  assert.equal(store.complete(task.taskId, alice, result).status, 'completed');
  assert.deepEqual(store.result(task.taskId, alice), result);
});

test('tool execution error produces failed task', () => {
  const store = new TaskStore();
  const task = store.create({ owner: alice });
  const result = { content: [{ type: 'text', text: 'upstream failed' }], isError: true };
  assert.equal(store.complete(task.taskId, alice, result).status, 'failed');
  assert.deepEqual(store.result(task.taskId, alice), result);
});

test('cancellation is terminal', () => {
  const store = new TaskStore();
  const task = store.create({ owner: alice });
  assert.equal(store.cancel(task.taskId, alice).status, 'cancelled');
  assert.throws(() => store.complete(task.taskId, alice, { isError: false }), /terminal/);
});

test('expired active task fails closed', () => {
  let now = Date.parse('2026-07-15T00:00:00Z');
  const store = new TaskStore({ clock: () => now });
  const task = store.create({ owner: alice, ttl: 1_000 });
  now += 1_001;
  assert.equal(store.get(task.taskId, alice).status, 'failed');
  assert.equal(store.result(task.taskId, alice).isError, true);
});
