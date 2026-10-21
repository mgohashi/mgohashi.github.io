---
title: "Managing secrets in Kubernetes with External Secrets Operator"
description: "How to securely sync secrets from an external vault into Kubernetes using the External Secrets Operator."
pubDate: 2024-06-05
tags: ["kubernetes", "security"]
categories: ["Blog", "Kubernetes"]
---

*This is an example post created to test the layout.*

Storing secrets directly in Kubernetes manifests, even as a `Secret`, is usually risky: the content is only base64-encoded, not encrypted, and anyone with read access to the cluster can decode it. The common solution is to keep the source of truth in an external vault and sync only what the cluster needs.

The *External Secrets Operator* (ESO) solves exactly this problem: it watches custom resources that declare where to fetch a secret from (AWS Secrets Manager, HashiCorp Vault, GCP Secret Manager, among others) and automatically creates/updates a native Kubernetes `Secret`.

## How it works

1. A `SecretStore` (or `ClusterSecretStore`) defines the connection to the external provider.
2. An `ExternalSecret` references which key to fetch and which `Secret` to sync to.
3. The operator polls the provider periodically and keeps the `Secret` up to date.

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

### Advantages of this approach

- The secret never needs to be committed to a Git repository.
- Credential rotation in the external vault propagates automatically to the cluster.
- Security teams keep centralized access control and auditing in the vault.

With ESO, Kubernetes becomes just a consumer of secrets rather than the source of truth — which greatly simplifies the cluster's overall security posture.
