import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assertSamplingCapability,
  buildToolResultMessage,
  chargeRequest,
  createBudget,
  nextToolChoice,
  validateToolUses,
} from './sampling-policy.mjs';

test('tool-enabled sampling requires sampling.tools', () => {
  assert.throws(() => assertSamplingCapability({ sampling: {} }, true), /tools-not-negotiated/);
  assert.doesNotThrow(() => assertSamplingCapability({ sampling: { tools: {} } }, true));
});

test('request budgets stop unbounded recursion', () => {
  let budget = createBudget({ maxRounds: 2, maxToolCalls: 2, maxTokens: 1000, deadlineMs: Date.now() + 1000 });
  budget = chargeRequest(budget, { maxTokens: 400, toolCount: 1 });
  budget = chargeRequest(budget, { maxTokens: 400, toolCount: 1 });
  assert.deepEqual(nextToolChoice(budget), { mode: 'none' });
  assert.throws(() => chargeRequest(budget, { maxTokens: 1 }), /round-budget/);
});

test('only allowlisted tools with object input are accepted', () => {
  const uses = validateToolUses([
    { type: 'tool_use', id: 'call_1', name: 'lookup_order', input: { id: 'o_1' } },
  ], new Set(['lookup_order']));
  assert.equal(uses.length, 1);
  assert.throws(() => validateToolUses([
    { type: 'tool_use', id: 'call_2', name: 'delete_order', input: {} },
  ], new Set(['lookup_order'])), /not-allowed/);
});

test('tool result messages contain only balanced results', () => {
  const uses = [
    { type: 'tool_use', id: 'call_1', name: 'lookup_order', input: { id: 'o_1' } },
    { type: 'tool_use', id: 'call_2', name: 'lookup_order', input: { id: 'o_2' } },
  ];
  const message = buildToolResultMessage(uses, new Map([['call_1', 'ready'], ['call_2', 'held']]));
  assert.equal(message.role, 'user');
  assert.deepEqual(message.content.map((part) => part.type), ['tool_result', 'tool_result']);
  assert.throws(() => buildToolResultMessage(uses, new Map([['call_1', 'ready']])), /missing/);
});

test('deadline is enforced independently of round limits', () => {
  const budget = createBudget({ deadlineMs: 0 });
  assert.throws(() => chargeRequest(budget, { maxTokens: 10, now: 1 }), /deadline/);
});
