import assert from 'node:assert/strict';
import test from 'node:test';
import { SpanStatusCode } from '@opentelemetry/api';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import {
  estimateUsd,
  runAgent,
  type AgentDependencies,
} from '../src/demo.js';

function harness() {
  const exporter = new InMemorySpanExporter();
  const provider = new NodeTracerProvider({
    resource: resourceFromAttributes({ 'service.name': 'test-agent' }),
    spanProcessors: [new SimpleSpanProcessor(exporter)],
  });
  return {
    exporter,
    provider,
    tracer: provider.getTracer('agent-test', '1.0.0'),
  };
}

const successDependencies: AgentDependencies = {
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

test('calculates estimated model cost from input and output tokens', () => {
  assert.equal(
    estimateUsd(1_000_000, 500_000, {
      inputPerMillion: 1.25,
      outputPerMillion: 10,
    }),
    6.25,
  );
});

test('exports one root with model and tool children and safe attributes', async () => {
  const { exporter, provider, tracer } = harness();
  assert.equal(
    await runAgent(tracer, 'run-test-001', successDependencies),
    'The shipment is scheduled for Friday.',
  );
  await provider.forceFlush();

  const spans = exporter.getFinishedSpans();
  assert.equal(spans.length, 3);
  const root = spans.find((span) => span.name === 'invoke_agent support-router');
  const model = spans.find((span) => span.name === 'chat demo-model');
  const tool = spans.find((span) => span.name === 'execute_tool shipment_lookup');
  assert.ok(root && model && tool);
  assert.equal(model.spanContext().traceId, root.spanContext().traceId);
  assert.equal(tool.spanContext().traceId, root.spanContext().traceId);
  assert.equal(model.parentSpanContext?.spanId, root.spanContext().spanId);
  assert.equal(tool.parentSpanContext?.spanId, root.spanContext().spanId);
  assert.equal(model.attributes['gen_ai.usage.input_tokens'], 820);
  assert.equal(model.attributes['gen_ai.usage.output_tokens'], 74);
  assert.equal(model.attributes['agent.pricing.version'], '2026-07-15');
  assert.ok(
    Math.abs(
      Number(model.attributes['agent.model.estimated_cost_usd']) - 0.001765,
    ) < 1e-12,
  );
  assert.equal(root.attributes['agent.run.outcome'], 'completed');
  const keys = spans.flatMap((span) => Object.keys(span.attributes));
  assert.equal(keys.some((key) => /prompt|message|argument|result$|credential|token$/i.test(key)), false);
  await provider.shutdown();
});

test('marks both tool and root spans when a tool fails', async () => {
  const { exporter, provider, tracer } = harness();
  const failing: AgentDependencies = {
    ...successDependencies,
    shipmentLookup: async () => {
      throw new Error('simulated timeout');
    },
  };
  await assert.rejects(runAgent(tracer, 'run-test-002', failing), /simulated timeout/);
  await provider.forceFlush();

  const spans = exporter.getFinishedSpans();
  const root = spans.find((span) => span.name === 'invoke_agent support-router');
  const tool = spans.find((span) => span.name === 'execute_tool shipment_lookup');
  assert.ok(root && tool);
  assert.equal(root.status.code, SpanStatusCode.ERROR);
  assert.equal(tool.status.code, SpanStatusCode.ERROR);
  assert.equal(root.attributes['error.type'], 'agent_run_failed');
  assert.equal(tool.attributes['error.type'], 'tool_execution_failed');
  assert.equal(tool.parentSpanContext?.spanId, root.spanContext().spanId);
  await provider.shutdown();
});
