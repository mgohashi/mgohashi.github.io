---
title: "Observabilidade com OpenTelemetry"
description: "Um panorama de como instrumentar aplicações com OpenTelemetry para obter traces, métricas e logs de forma padronizada."
pubDate: 2024-01-10
tags: ["opentelemetry", "observability"]
categories: ["Blog", "Observability"]
---

*Este é um post de exemplo criado para testar o layout.*

Observabilidade deixou de ser um "nice to have" para se tornar parte essencial de qualquer sistema distribuído. Quando um pedido de usuário atravessa dezenas de serviços, entender onde o tempo foi gasto ou onde um erro começou exige mais do que logs isolados: exige correlação entre traces, métricas e logs.

O *OpenTelemetry* (OTel) surgiu como a especificação e o conjunto de bibliotecas que unificam essa coleta, substituindo soluções proprietárias fragmentadas por um padrão aberto suportado pela maioria dos backends de observabilidade do mercado.

## Os três pilares

OpenTelemetry organiza a telemetria em três sinais complementares:

- **Traces**: mostram o caminho de uma requisição através dos serviços, com spans que registram duração e metadados de cada etapa.
- **Metrics**: valores numéricos agregados no tempo, como latência percentil ou taxa de erros.
- **Logs**: eventos discretos, normalmente associados a um trace para permitir correlação direta.

## Instrumentando um serviço

A instrumentação pode ser automática (via agentes) ou manual (via SDK). Um exemplo mínimo de configuração de um exportador OTLP em um serviço:

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

Depois de configurado o collector, basta apontar o SDK da aplicação para o endpoint correto e os spans começam a fluir, sem necessidade de alterar a lógica de negócio.

### Boas práticas

1. Padronize nomes de spans e atributos entre serviços.
2. Use amostragem (sampling) para controlar custo em alto volume.
3. Correlacione logs com `trace_id` sempre que possível.

Com esses fundamentos, times conseguem reduzir drasticamente o tempo de diagnóstico de incidentes em produção.
