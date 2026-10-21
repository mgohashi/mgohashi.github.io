---
title: "Progressive deployment strategies (canary and blue-green)"
description: "How to reduce the risk of new releases in production using canary and blue-green deployments on Kubernetes."
pubDate: 2024-03-22
tags: ["deploy", "kubernetes"]
categories: ["Blog", "Kubernetes"]
---

*This is an example post created to test the layout.*

Shipping a new version of a service always carries risk. The question isn't whether something will go wrong, but how fast we can detect and roll back the problem before it affects every user. Progressive deployment strategies exist precisely to limit that blast radius.

Two popular approaches in Kubernetes environments are *canary release* and *blue-green deployment*. Both avoid the "big bang" of switching 100% of traffic at once.

## Canary release

With canary, a small percentage of traffic is routed to the new version while most of it stays on the stable version. If error and latency metrics stay healthy, the percentage gradually increases until it reaches 100%.

```bash
kubectl apply -f canary-deployment.yaml
kubectl argo rollouts set image my-app my-app=my-app:v2
kubectl argo rollouts get rollout my-app --watch
```

## Blue-green deployment

With blue-green, two complete versions coexist (`blue` = current, `green` = new). Traffic is switched all at once, usually by flipping a `Service` selector, which allows an instant rollback by pointing back to the previous environment.

### When to use each one

- **Canary**: when you want to validate real metrics with gradual exposure and lower risk per request.
- **Blue-green**: when instant rollback is the priority and the cost of maintaining two full environments is acceptable.

Both strategies depend on good metrics and automated alerting — without observability, there's no way to confidently decide when to advance or roll back a rollout.
