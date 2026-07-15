import assert from 'node:assert/strict';
import test from 'node:test';
import {
  agentCard,
  assertTaskTransition,
  buildSendMessageRequest,
  listVisibleTasks,
  validateV1AgentCard,
} from './migration-lab.mjs';

test('accepts a v1 Agent Card with interface-scoped versioning', () => {
  assert.deepEqual(validateV1AgentCard(agentCard), {ok: true, errors: []});
});

test('rejects pre-v1 Agent Card transport fields', () => {
  const oldCard = {...agentCard, protocolVersion: '0.3.0', preferredTransport: 'JSONRPC'};
  const result = validateV1AgentCard(oldCard);
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /pre-v1 shape/);
  assert.match(result.errors.join('\n'), /supportedInterfaces/);
});

test('builds a v1 SendMessage request', () => {
  const request = buildSendMessageRequest({text: 'Review invoice'});
  assert.equal(request.method, 'SendMessage');
  assert.equal(request.params.message.role, 'ROLE_USER');
  assert.deepEqual(request.params.message.parts, [{text: 'Review invoice'}]);
  assert.equal('kind' in request.params.message.parts[0], false);
});

test('preserves context and task references for refinements', () => {
  const request = buildSendMessageRequest({
    text: 'Use the corrected tax amount',
    contextId: 'ctx-1',
    referenceTaskIds: ['task-1'],
  });
  assert.equal(request.params.message.contextId, 'ctx-1');
  assert.deepEqual(request.params.message.referenceTaskIds, ['task-1']);
});

test('rejects lowercase pre-v1 task states', () => {
  assert.throws(() => assertTaskTransition('submitted', 'working'), /TASK_STATE/);
});

test('forbids transitions out of terminal task states', () => {
  assert.throws(
    () => assertTaskTransition('TASK_STATE_COMPLETED', 'TASK_STATE_WORKING'),
    /terminal task/,
  );
});

test('scopes task listing to both subject and tenant', () => {
  const tasks = [
    {id: 'mine', owner: 'client-17', tenant: 'acme'},
    {id: 'other-user', owner: 'client-18', tenant: 'acme'},
    {id: 'other-tenant', owner: 'client-17', tenant: 'globex'},
  ];
  assert.deepEqual(
    listVisibleTasks(tasks, {subject: 'client-17', tenant: 'acme'}).map(({id}) => id),
    ['mine'],
  );
});

test('requires an authenticated principal before listing tasks', () => {
  assert.throws(() => listVisibleTasks([], null), /authenticated principal/);
});
