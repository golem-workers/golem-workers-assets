import { buildToolResultMessage, chargeRequest, createBudget, nextToolChoice, validateToolUses } from './sampling-policy.mjs';

let budget = createBudget({ maxRounds: 2, maxToolCalls: 2, maxTokens: 1200 });
const response = {
  stopReason: 'toolUse',
  content: [{ type: 'tool_use', id: 'call_1', name: 'lookup_order', input: { id: 'o_1' } }],
};
const uses = validateToolUses(response.content, new Set(['lookup_order']));
budget = chargeRequest(budget, { maxTokens: 600, toolCount: uses.length });
console.log(JSON.stringify({
  toolResultMessage: buildToolResultMessage(uses, new Map([['call_1', 'ready']])),
  nextToolChoice: nextToolChoice(budget),
  budget,
}, null, 2));
