import {
  context,
  SpanStatusCode,
  trace,
  type Context,
  type Tracer,
} from '@opentelemetry/api';

type RunResult = {
  answer: string;
  inputTokens: number;
  outputTokens: number;
};

export function estimateUsd(
  inputTokens: number,
  outputTokens: number,
  price: { inputPerMillion: number; outputPerMillion: number },
): number {
  return (
    (inputTokens / 1_000_000) * price.inputPerMillion +
    (outputTokens / 1_000_000) * price.outputPerMillion
  );
}

export type AgentDependencies = {
  shipmentLookup: () => Promise<{ status: string }>;
  modelGenerate: () => Promise<RunResult & { model: string }>;
  pricing: {
    version: string;
    inputPerMillion: number;
    outputPerMillion: number;
  };
};

async function callModel(
  tracer: Tracer,
  dependencies: AgentDependencies,
  parentContext: Context,
): Promise<RunResult> {
  return tracer.startActiveSpan(
    'chat demo-model',
    {
      attributes: {
        'gen_ai.operation.name': 'chat',
        'gen_ai.provider.name': 'demo_provider',
        'gen_ai.request.model': 'demo-model-2026-07',
      },
    },
    parentContext,
    async (span) => {
      try {
        const result = await dependencies.modelGenerate();
        span.setAttributes({
          'gen_ai.response.model': result.model,
          'gen_ai.usage.input_tokens': result.inputTokens,
          'gen_ai.usage.output_tokens': result.outputTokens,
          'agent.model.estimated_cost_usd': estimateUsd(
            result.inputTokens,
            result.outputTokens,
            dependencies.pricing,
          ),
          'agent.pricing.version': dependencies.pricing.version,
        });
        return result;
      } catch (error) {
        span.recordException(error as Error);
        span.setAttribute('error.type', 'model_request_failed');
        span.setStatus({ code: SpanStatusCode.ERROR });
        throw error;
      } finally {
        span.end();
      }
    },
  );
}

async function lookupShipment(
  tracer: Tracer,
  dependencies: AgentDependencies,
  parentContext: Context,
): Promise<{ status: string }> {
  return tracer.startActiveSpan(
    'execute_tool shipment_lookup',
    {
      attributes: {
        'gen_ai.operation.name': 'execute_tool',
        'gen_ai.tool.name': 'shipment_lookup',
        'gen_ai.tool.type': 'function',
      },
    },
    parentContext,
    async (span) => {
      try {
        const result = await dependencies.shipmentLookup();
        // Keep arguments and results out of spans by default.
        span.setAttribute('agent.tool.result_class', 'success');
        return result;
      } catch (error) {
        span.recordException(error as Error);
        span.setAttribute('error.type', 'tool_execution_failed');
        span.setStatus({ code: SpanStatusCode.ERROR });
        throw error;
      } finally {
        span.end();
      }
    },
  );
}

export async function runAgent(
  tracer: Tracer,
  runId: string,
  dependencies: AgentDependencies,
): Promise<string> {
  return tracer.startActiveSpan(
    'invoke_agent support-router',
    {
      attributes: {
        'gen_ai.operation.name': 'invoke_agent',
        'gen_ai.provider.name': 'demo_provider',
        'gen_ai.agent.name': 'support-router',
        'gen_ai.agent.version': '1.0.0',
        'agent.run.id': runId,
      },
    },
    async (span) => {
      try {
        const rootContext = trace.setSpan(context.active(), span);
        await lookupShipment(tracer, dependencies, rootContext);
        const result = await callModel(tracer, dependencies, rootContext);
        span.setAttribute('agent.run.outcome', 'completed');
        return result.answer;
      } catch (error) {
        span.recordException(error as Error);
        span.setAttribute('error.type', 'agent_run_failed');
        span.setStatus({ code: SpanStatusCode.ERROR });
        throw error;
      } finally {
        span.end();
      }
    },
  );
}
