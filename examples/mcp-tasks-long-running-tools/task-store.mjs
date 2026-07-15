import { randomUUID } from 'node:crypto';

const TERMINAL = new Set(['completed', 'failed', 'cancelled']);
const ACTIVE = new Set(['working', 'input_required']);

function nowIso(clock) {
  return new Date(clock()).toISOString();
}

function publicTask(row) {
  const { owner: _owner, result: _result, expiresAt: _expiresAt, ...task } = row;
  return structuredClone(task);
}

export class TaskStore {
  #rows = new Map();
  #clock;

  constructor({ clock = Date.now } = {}) {
    this.#clock = clock;
  }

  create({ owner, ttl = 60_000, pollInterval = 1_000, statusMessage = 'Queued' }) {
    if (!owner?.subject || !owner?.tenant) throw new Error('authorization context required');
    if (!Number.isInteger(ttl) || ttl < 1_000 || ttl > 3_600_000) throw new Error('ttl out of range');
    const createdAt = nowIso(this.#clock);
    const row = {
      taskId: randomUUID(), owner: { ...owner }, status: 'working', statusMessage,
      createdAt, lastUpdatedAt: createdAt, ttl, pollInterval,
      expiresAt: this.#clock() + ttl, result: undefined,
    };
    this.#rows.set(row.taskId, row);
    return publicTask(row);
  }

  get(taskId, owner) {
    const row = this.#owned(taskId, owner);
    this.#expire(row);
    return publicTask(row);
  }

  list(owner) {
    if (!owner?.subject || !owner?.tenant) throw new Error('authorization context required');
    return [...this.#rows.values()]
      .filter((row) => row.owner.subject === owner.subject && row.owner.tenant === owner.tenant)
      .map((row) => { this.#expire(row); return publicTask(row); });
  }

  requireInput(taskId, owner, statusMessage) {
    return this.#transition(taskId, owner, 'input_required', statusMessage);
  }

  resume(taskId, owner, statusMessage = 'Resumed') {
    const row = this.#owned(taskId, owner);
    this.#expire(row);
    if (row.status !== 'input_required') throw new Error('task is not waiting for input');
    return this.#transition(taskId, owner, 'working', statusMessage);
  }

  complete(taskId, owner, result) {
    const row = this.#owned(taskId, owner);
    this.#expire(row);
    if (!ACTIVE.has(row.status)) throw new Error('task is terminal');
    row.result = structuredClone(result);
    return this.#transition(taskId, owner, result?.isError ? 'failed' : 'completed', result?.isError ? 'Tool execution failed' : 'Completed');
  }

  cancel(taskId, owner) {
    const row = this.#owned(taskId, owner);
    this.#expire(row);
    if (TERMINAL.has(row.status)) throw new Error('task is terminal');
    return this.#transition(taskId, owner, 'cancelled', 'Cancelled by requestor');
  }

  result(taskId, owner) {
    const row = this.#owned(taskId, owner);
    this.#expire(row);
    if (!TERMINAL.has(row.status)) throw new Error('result is not ready');
    if (row.status === 'cancelled') throw new Error('task was cancelled');
    return structuredClone(row.result);
  }

  #owned(taskId, owner) {
    if (!owner?.subject || !owner?.tenant) throw new Error('authorization context required');
    const row = this.#rows.get(taskId);
    if (!row || row.owner.subject !== owner.subject || row.owner.tenant !== owner.tenant) {
      throw new Error('task not found');
    }
    return row;
  }

  #expire(row) {
    if (!TERMINAL.has(row.status) && this.#clock() >= row.expiresAt) {
      row.status = 'failed';
      row.statusMessage = 'Task expired';
      row.lastUpdatedAt = nowIso(this.#clock);
      row.result = { content: [{ type: 'text', text: 'Task expired' }], isError: true };
    }
  }

  #transition(taskId, owner, status, statusMessage) {
    const row = this.#owned(taskId, owner);
    if (TERMINAL.has(row.status)) throw new Error('task is terminal');
    row.status = status;
    row.statusMessage = statusMessage;
    row.lastUpdatedAt = nowIso(this.#clock);
    return publicTask(row);
  }
}

export function supportsTaskCall(serverCapabilities, tool) {
  const calls = serverCapabilities?.tasks?.requests?.tools?.call;
  const support = tool?.execution?.taskSupport ?? 'forbidden';
  return Boolean(calls) && (support === 'optional' || support === 'required');
}
