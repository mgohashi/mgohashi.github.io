---
title: "Observability with OpenTelemetry"
description: "An overview of how to instrument applications with OpenTelemetry to get traces, metrics, and logs in a standardized way."
pubDate: 2024-01-10
tags: ["opentelemetry", "observability"]
categories: ["Blog", "Observability"]
---

*This is an example post created to test the layout.*

Observability has gone from "nice to have" to an essential part of any distributed system. When a user request travels through dozens of services, understanding where time was spent or where an error started requires more than isolated logs: it requires correlation between traces, metrics, and logs.

*OpenTelemetry* (OTel) emerged as the specification and set of libraries that unify this collection, replacing fragmented proprietary solutions with an open standard supported by most observability backends on the market.

## The three pillars

OpenTelemetry organizes telemetry into three complementary signals:

- **Traces**: show the path of a request across services, with spans that record duration and metadata for each step.
- **Metrics**: aggregated numeric values over time, like latency percentiles or error rates.
- **Logs**: discrete events, usually tied to a trace to allow direct correlation.

## Instrumenting a service

Instrumentation can be automatic (via agents) or manual (via SDK). Here's a minimal example of configuring an OTLP exporter for a service:

```yaml
exporters:
  otlp:
    endpoint: otel-collector:4317
    tls:
      insecure: true

service:
  pipelines:
    traces:
      receivers: [otlp]
      exporters: [otlp]
```

Once the collector is configured, you just need to point the application's SDK at the correct endpoint, and spans start flowing without touching any business logic.

### Best practices

1. Standardize span and attribute names across services.
2. Use sampling to control cost at high volume.
3. Correlate logs with `trace_id` whenever possible.

With these fundamentals in place, teams can drastically reduce the time it takes to diagnose incidents in production.
