import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';

const exporter = process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT
  ? new OTLPTraceExporter({
      url: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT,
      headers: process.env.OTEL_EXPORTER_OTLP_HEADERS
        ? Object.fromEntries(
            process.env.OTEL_EXPORTER_OTLP_HEADERS.split(',').map((entry) => {
              const separator = entry.indexOf('=');
              return [entry.slice(0, separator), entry.slice(separator + 1)];
            }),
          )
        : undefined,
    })
  : new ConsoleSpanExporter();

export const provider = new NodeTracerProvider({
  resource: resourceFromAttributes({
    'service.name': 'support-agent',
    'service.version': '1.0.0',
    'deployment.environment.name': process.env.NODE_ENV ?? 'development',
  }),
  spanProcessors: [new BatchSpanProcessor(exporter)],
});

provider.register();

export async function shutdownTracing(): Promise<void> {
  await provider.forceFlush();
  await provider.shutdown();
}
