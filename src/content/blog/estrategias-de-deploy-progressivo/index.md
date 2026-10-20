---
title: "Estratégias de deploy progressivo (canary e blue-green)"
description: "Como reduzir o risco de novas versões em produção usando deploys canary e blue-green no Kubernetes."
pubDate: 2024-03-22
tags: ["deploy", "kubernetes"]
categories: ["Blog", "Kubernetes"]
---

*Este é um post de exemplo criado para testar o layout.*

Lançar uma nova versão de um serviço sempre carrega risco. A pergunta não é se algo vai dar errado, mas quão rápido conseguimos detectar e reverter o problema antes que afete todos os usuários. Estratégias de deploy progressivo existem justamente para limitar esse raio de impacto.

Duas abordagens populares em ambientes Kubernetes são o *canary release* e o *blue-green deployment*. Ambas evitam o "big bang" de substituir 100% do tráfego de uma vez.

## Canary release

No canary, uma pequena porcentagem do tráfego é direcionada para a nova versão enquanto a maioria continua na versão estável. Se as métricas de erro e latência se mantiverem saudáveis, o percentual aumenta gradualmente até 100%.

```bash
kubectl apply -f canary-deployment.yaml
kubectl argo rollouts set image my-app my-app=my-app:v2
kubectl argo rollouts get rollout my-app --watch
```

## Blue-green deployment

Já no blue-green, duas versões completas coexistem (`blue` = atual, `green` = nova). O tráfego é alternado de uma vez só, geralmente trocando o seletor de um `Service`, o que permite rollback imediato apontando de volta para o ambiente anterior.

### Quando usar cada um

- **Canary**: quando se quer validar métricas reais com exposição gradual e menor risco por request.
- **Blue-green**: quando o rollback instantâneo é prioridade e o custo de manter dois ambientes completos é aceitável.

Ambas as estratégias dependem de boas métricas e alertas automatizados — sem observabilidade, não há como decidir com confiança quando avançar ou reverter um rollout.
