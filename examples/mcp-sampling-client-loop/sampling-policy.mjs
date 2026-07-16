export function assertSamplingCapability(capabilities, needsTools = false) {
  if (!capabilities?.sampling) throw new Error('sampling-not-negotiated');
  if (needsTools && !capabilities.sampling.tools) {
    throw new Error('sampling-tools-not-negotiated');
  }
}

export function createBudget(overrides = {}) {
  return {
    maxRounds: 3,
    maxToolCalls: 6,
    maxTokens: 4096,
    deadlineMs: Date.now() + 30_000,
    rounds: 0,
    toolCalls: 0,
    requestedTokens: 0,
    ...overrides,
  };
}

export function chargeRequest(budget, { maxTokens, toolCount = 0, now = Date.now() }) {
  const next = {
    ...budget,
    rounds: budget.rounds + 1,
    toolCalls: budget.toolCalls + toolCount,
    requestedTokens: budget.requestedTokens + maxTokens,
  };
  if (now > budget.deadlineMs) throw new Error('sampling-deadline-exceeded');
  if (next.rounds > budget.maxRounds) throw new Error('sampling-round-budget-exceeded');
  if (next.toolCalls > budget.maxToolCalls) throw new Error('sampling-tool-budget-exceeded');
  if (next.requestedTokens > budget.maxTokens) throw new Error('sampling-token-budget-exceeded');
  return next;
}

export function validateToolUses(content, allowedTools) {
  const uses = Array.isArray(content) ? content.filter((part) => part.type === 'tool_use') : [];
  for (const use of uses) {
    if (!use.id || !allowedTools.has(use.name)) throw new Error('sampling-tool-not-allowed');
    if (!use.input || typeof use.input !== 'object' || Array.isArray(use.input)) {
      throw new Error('sampling-tool-input-invalid');
    }
  }
  return uses;
}

export function buildToolResultMessage(toolUses, resultsById) {
  const content = toolUses.map((use) => {
    if (!resultsById.has(use.id)) throw new Error('sampling-tool-result-missing');
    return {
      type: 'tool_result',
      toolUseId: use.id,
      content: [{ type: 'text', text: String(resultsById.get(use.id)) }],
    };
  });
  if (content.length !== resultsById.size) throw new Error('sampling-tool-result-unmatched');
  return { role: 'user', content };
}

export function nextToolChoice(budget) {
  return budget.rounds >= budget.maxRounds ? { mode: 'none' } : { mode: 'auto' };
}
