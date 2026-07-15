import { trace } from '@opentelemetry/api';
import { runAgent, type AgentDependencies } from './demo.js';
import { shutdownTracing } from './tracing.js';

const tracer = trace.getTracer('support-agent', '1.0.0');

const dependencies: AgentDependencies = {
  shipmentLookup: async () => ({ status: 'scheduled' }),
  modelGenerate: async () => ({
    answer: 'The shipment is scheduled for Friday.',
    model: 'demo-model-2026-07',
    inputTokens: 820,
    outputTokens: 74,
  }),
  pricing: {
    version: '2026-07-15',
    inputPerMillion: 1.25,
    outputPerMillion: 10,
  },
};

try {
  console.log(await runAgent(tracer, `run-${Date.now()}`, dependencies));
} finally {
  await shutdownTracing();
}
