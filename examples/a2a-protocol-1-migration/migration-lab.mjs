import {randomUUID} from 'node:crypto';

const TERMINAL_STATES = new Set([
  'TASK_STATE_COMPLETED',
  'TASK_STATE_CANCELED',
  'TASK_STATE_REJECTED',
  'TASK_STATE_FAILED',
]);

export function validateV1AgentCard(card) {
  const errors = [];
  if (!card || typeof card !== 'object') errors.push('card must be an object');
  if (!card?.name) errors.push('name is required');
  if (!Array.isArray(card?.supportedInterfaces) || card.supportedInterfaces.length === 0) {
    errors.push('supportedInterfaces must contain at least one interface');
  }
  for (const [index, entry] of (card?.supportedInterfaces ?? []).entries()) {
    if (!entry.url) errors.push(`supportedInterfaces[${index}].url is required`);
    if (!entry.protocolBinding) errors.push(`supportedInterfaces[${index}].protocolBinding is required`);
    if (!entry.protocolVersion) errors.push(`supportedInterfaces[${index}].protocolVersion is required`);
  }
  if (!Array.isArray(card?.skills)) errors.push('skills must be an array');
  if ('protocolVersion' in (card ?? {})) {
    errors.push('top-level protocolVersion is a pre-v1 shape');
  }
  if ('preferredTransport' in (card ?? {}) || 'additionalInterfaces' in (card ?? {})) {
    errors.push('preferredTransport/additionalInterfaces must be migrated to supportedInterfaces');
  }
  return {ok: errors.length === 0, errors};
}

export function buildSendMessageRequest({text, contextId, referenceTaskIds = []}) {
  if (!text?.trim()) throw new Error('text is required');
  const message = {
    role: 'ROLE_USER',
    messageId: randomUUID(),
    parts: [{text: text.trim()}],
  };
  if (contextId) message.contextId = contextId;
  if (referenceTaskIds.length) message.referenceTaskIds = [...referenceTaskIds];
  return {jsonrpc: '2.0', id: randomUUID(), method: 'SendMessage', params: {message}};
}

export function assertTaskTransition(previousState, nextState) {
  if (!previousState?.startsWith('TASK_STATE_') || !nextState?.startsWith('TASK_STATE_')) {
    throw new Error('A2A v1 task states must use TASK_STATE_* enum values');
  }
  if (TERMINAL_STATES.has(previousState)) {
    throw new Error(`terminal task ${previousState} cannot transition to ${nextState}`);
  }
  return true;
}

export function listVisibleTasks(tasks, principal) {
  if (!principal?.subject || !principal?.tenant) throw new Error('authenticated principal is required');
  return tasks.filter((task) => task.owner === principal.subject && task.tenant === principal.tenant);
}

export const agentCard = {
  name: 'Invoice Review Agent',
  description: 'Reviews invoice exceptions and returns a structured decision.',
  version: '1.0.0',
  supportedInterfaces: [{
    url: 'https://agent.example/a2a',
    protocolBinding: 'JSONRPC',
    protocolVersion: '1.0',
  }],
  capabilities: {streaming: true, extendedAgentCard: true},
  defaultInputModes: ['text/plain', 'application/json'],
  defaultOutputModes: ['application/json'],
  skills: [{
    id: 'review-invoice',
    name: 'Review invoice',
    description: 'Checks a normalized invoice against policy.',
    tags: ['finance', 'review'],
  }],
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const validation = validateV1AgentCard(agentCard);
  const request = buildSendMessageRequest({text: 'Review invoice INV-1042'});
  const visible = listVisibleTasks([
    {id: 'task-a', owner: 'client-17', tenant: 'acme'},
    {id: 'task-b', owner: 'client-18', tenant: 'acme'},
    {id: 'task-c', owner: 'client-17', tenant: 'globex'},
  ], {subject: 'client-17', tenant: 'acme'});
  console.log(JSON.stringify({validation, request, visible}, null, 2));
}
