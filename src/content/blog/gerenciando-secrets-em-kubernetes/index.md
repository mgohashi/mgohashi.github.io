---
title: "Gerenciando secrets em Kubernetes com External Secrets Operator"
description: "Como sincronizar segredos de um cofre externo para o Kubernetes de forma segura usando o External Secrets Operator."
pubDate: 2024-06-05
tags: ["kubernetes", "security"]
categories: ["Blog", "Kubernetes"]
---

*Este é um post de exemplo criado para testar o layout.*

Guardar segredos diretamente em manifestos do Kubernetes, mesmo como `Secret`, costuma ser uma prática arriscada: o conteúdo é apenas codificado em base64, não criptografado, e qualquer pessoa com acesso de leitura ao cluster pode decodificá-lo. A solução comum é manter a fonte da verdade em um cofre externo e sincronizar apenas o necessário para o cluster.

O *External Secrets Operator* (ESO) resolve exatamente esse problema: ele observa recursos customizados declarando de onde buscar um segredo (AWS Secrets Manager, HashiCorp Vault, GCP Secret Manager, entre outros) e cria/atualiza automaticamente um `Secret` nativo do Kubernetes.

## Como funciona

1. Um `SecretStore` (ou `ClusterSecretStore`) define a conexão com o provedor externo.
2. Um `ExternalSecret` referencia qual chave buscar e para qual `Secret` sincronizar.
3. O operator consulta o provedor periodicamente e mantém o `Secret` atualizado.

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: db-credentials
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secrets-manager
    kind: ClusterSecretStore
  target:
    name: db-credentials
  data:
    - secretKey: password
      remoteRef:
        key: prod/db/password
```

### Vantagens dessa abordagem

- O segredo nunca precisa ser commitado em um repositório Git.
- Rotação de credenciais no cofre externo propaga automaticamente para o cluster.
- Times de segurança mantêm controle centralizado de acesso e auditoria no cofre.

Com o ESO, o Kubernetes passa a ser apenas um consumidor de segredos, não a fonte de verdade — o que simplifica bastante a postura de segurança geral do cluster.
