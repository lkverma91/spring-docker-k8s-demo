# Kubernetes — Implementation Guide

This document explains how Kubernetes is used in this project: the architecture, Kustomize overlay structure, secrets management, and deployment strategy for DEV, TEST, and PROD.

---

## Table of Contents

1. [Why Kubernetes?](#1-why-kubernetes)
2. [Architecture Overview](#2-architecture-overview)
3. [Kustomize — Base & Overlays](#3-kustomize--base--overlays)
4. [Manifest Breakdown](#4-manifest-breakdown)
5. [Secrets Management](#5-secrets-management)
6. [Horizontal Pod Autoscaler (PROD)](#6-horizontal-pod-autoscaler-prod)
7. [Health Probes](#7-health-probes)
8. [Graceful Shutdown](#8-graceful-shutdown)
9. [Common kubectl Commands](#9-common-kubectl-commands)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Why Kubernetes?

Docker alone runs containers on a **single host**. Kubernetes orchestrates containers across a **cluster**, providing:

| Feature | How It Helps |
|---------|-------------|
| **Self-healing** | Restarts crashed containers automatically |
| **Auto-scaling** | HPA scales pods based on CPU/memory |
| **Rolling deployments** | Zero-downtime updates |
| **Service discovery** | Pods find each other by DNS name, not IP |
| **Config management** | ConfigMaps and Secrets separate config from code |
| **Resource control** | CPU/memory requests and limits prevent noisy neighbors |

---

## 2. Architecture Overview

```
                          ┌─────────────────────────────────────────┐
                          │           Kubernetes Cluster            │
                          │                                         │
Internet ──▶  Ingress  ──▶│  Service (ClusterIP)                   │
              (nginx)     │       │                                 │
                          │       ▼                                 │
                          │  ┌─────────┐  ┌─────────┐             │
                          │  │  Pod 1  │  │  Pod 2  │  (PROD: 2+) │
                          │  │  App    │  │  App    │             │
                          │  └─────────┘  └─────────┘             │
                          │       │                                 │
                          │       ▼                                 │
                          │  Postgres Service (ClusterIP)           │
                          │       │                                 │
                          │       ▼                                 │
                          │  Postgres Pod ──▶ PersistentVolumeClaim │
                          └─────────────────────────────────────────┘
```

---

## 3. Kustomize — Base & Overlays

We use **Kustomize** (built into `kubectl` since v1.14) instead of Helm to manage environment-specific configurations.

### Why Kustomize over Helm?

- **No templating language** — plain YAML, readable by anyone
- **Patch-based** — overlays only change what's different, base is the single source of truth
- **Built into kubectl** — no extra tooling needed
- **Git-friendly** — diffs are clean and reviewable

### Directory Structure

```
k8s/
├── base/                        # Shared resources — single source of truth
│   ├── kustomization.yml        # Lists all base resources
│   ├── namespace.yml
│   ├── deployment.yml           # App deployment (1 replica by default)
│   ├── service.yml              # ClusterIP service
│   ├── ingress.yml              # Ingress with nginx
│   ├── postgres-deployment.yml
│   ├── postgres-service.yml
│   └── postgres-pvc.yml
└── overlays/
    ├── dev/
    │   ├── kustomization.yml    # Patches: 1 replica, dev image, dev host
    │   ├── configmap.yml        # SPRING_PROFILES_ACTIVE=dev, db name
    │   └── secret.yml           # Dev credentials (base64)
    ├── test/
    │   ├── kustomization.yml    # Patches: 1 replica, test image, test host
    │   ├── configmap.yml
    │   └── secret.yml
    └── prod/
        ├── kustomization.yml    # Patches: 2 replicas, larger resources, TLS
        ├── configmap.yml
        ├── secret.yml           # Placeholder — inject from CI/CD
        └── hpa.yml              # Horizontal Pod Autoscaler (prod only)
```

### How Kustomize Works

1. **Base** defines the canonical resource spec
2. **Overlay** has a `kustomization.yml` that:
   - Sets `namespace` (different per environment)
   - Adds `namePrefix` (e.g., `dev-`, `prod-`) to avoid resource name collisions
   - Adds `commonLabels` (e.g., `environment: prod`)
   - Applies **strategic merge patches** or **JSON 6902 patches** to change specific fields
   - Adds environment-specific resources (ConfigMap, Secret, HPA)

```bash
# Preview what will be applied (dry run)
kubectl kustomize k8s/overlays/dev/

# Apply to cluster
kubectl apply -k k8s/overlays/dev/
kubectl apply -k k8s/overlays/test/
kubectl apply -k k8s/overlays/prod/
```

---

## 4. Manifest Breakdown

### `namespace.yml`

Creates isolated Kubernetes namespaces per environment:
- `products-app-dev`
- `products-app-test`
- `products-app-prod`

Namespaces provide resource isolation, independent RBAC, and resource quotas.

### `deployment.yml` (App)

Key production-ready settings:

```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1        # Spin up 1 extra pod before terminating old
    maxUnavailable: 0  # Never have fewer than desired pods available
```

This guarantees **zero-downtime deployments**.

```yaml
terminationGracePeriodSeconds: 60  # Wait 60s for in-flight requests
lifecycle:
  preStop:
    exec:
      command: ["/bin/sh", "-c", "sleep 10"]  # Let load balancer deregister
```

### `postgres-deployment.yml`

```yaml
strategy:
  type: Recreate  # Kill old pod before creating new one
```

`Recreate` for PostgreSQL because two Postgres instances writing to the same PVC simultaneously would corrupt data.

### `postgres-pvc.yml`

```yaml
accessModes:
  - ReadWriteOnce  # Only one node can mount this at a time
resources:
  requests:
    storage: 5Gi   # 5GB for dev/test, 20GB in prod overlay
```

### `ingress.yml`

Routes external traffic to the app service. Prod overlay adds:
- TLS termination with Let's Encrypt (`cert-manager`)
- SSL redirect
- Custom timeout annotations

---

## 5. Secrets Management

### Development / Test

Base64-encoded values stored in `secret.yml` (acceptable for non-production):

```bash
# Encode a value
echo -n "mypassword" | base64
```

### Production (Recommended Approaches)

**Never commit real production secrets to Git.** Instead:

#### Option A: External Secrets Operator (recommended)

```yaml
# ExternalSecret pulls from AWS Secrets Manager, Vault, etc.
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: app-secret
spec:
  secretStoreRef:
    name: aws-secrets-manager
    kind: ClusterSecretStore
  target:
    name: app-secret
  data:
    - secretKey: POSTGRES_PASSWORD
      remoteRef:
        key: prod/products-app/postgres-password
```

#### Option B: Sealed Secrets (GitOps friendly)

```bash
# Encrypt secrets — safe to commit
kubeseal --format yaml < secret.yml > sealed-secret.yml
git add sealed-secret.yml
```

#### Option C: Inject from CI/CD (current approach)

```bash
# In .gitlab-ci.yml deploy-prod job:
kubectl create secret generic app-secret \
  --from-literal=POSTGRES_USER=$PROD_DB_USER \
  --from-literal=POSTGRES_PASSWORD=$PROD_DB_PASSWORD \
  --namespace=products-app-prod \
  --dry-run=client -o yaml | kubectl apply -f -
```

---

## 6. Horizontal Pod Autoscaler (PROD)

The `hpa.yml` in the prod overlay automatically scales pods:

```yaml
minReplicas: 2   # Always at least 2 pods (HA)
maxReplicas: 10  # Never more than 10

metrics:
  - CPU > 70%  → scale out
  - Memory > 80% → scale out
```

**Requirements:** Metrics Server must be installed on the cluster:
```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

---

## 7. Health Probes

Spring Actuator provides three probe endpoints used by Kubernetes:

| Probe | Endpoint | Purpose |
|-------|----------|---------|
| **Liveness** | `/actuator/health/liveness` | Is the app alive? Restart if fails. |
| **Readiness** | `/actuator/health/readiness` | Is the app ready for traffic? Remove from Service if fails. |
| **Startup** | (uses liveness with delay) | Slow start? Give extra time before liveness kicks in. |

Configuration in `deployment.yml`:

```yaml
livenessProbe:
  httpGet:
    path: /actuator/health/liveness
    port: 8080
  initialDelaySeconds: 60   # Wait 60s before first check (app startup)
  periodSeconds: 15
  failureThreshold: 3       # 3 failures = restart pod

readinessProbe:
  httpGet:
    path: /actuator/health/readiness
    port: 8080
  initialDelaySeconds: 30
  periodSeconds: 10
  failureThreshold: 3       # 3 failures = remove from Service LB
```

---

## 8. Graceful Shutdown

Both Spring Boot and Kubernetes are configured for graceful shutdown:

```yaml
# application-prod.yml
server:
  shutdown: graceful
spring.lifecycle.timeout-per-shutdown-phase: 30s
```

```yaml
# deployment.yml
terminationGracePeriodSeconds: 60
lifecycle:
  preStop:
    exec:
      command: ["/bin/sh", "-c", "sleep 10"]
```

**Shutdown sequence:**
1. K8s sends `SIGTERM` to pod
2. `preStop` hook runs: sleeps 10s (gives load balancer time to stop routing traffic)
3. Spring Boot stops accepting new requests, finishes existing ones (up to 30s)
4. After 60s, K8s forcefully kills with `SIGKILL` if still running

---

## 9. Common kubectl Commands

```bash
# View all pods in namespace
kubectl get pods -n products-app-dev

# View pod logs
kubectl logs -f deployment/dev-products-app -n products-app-dev

# Describe a pod (useful for debugging CrashLoopBackOff)
kubectl describe pod <pod-name> -n products-app-dev

# Execute into a running pod
kubectl exec -it <pod-name> -n products-app-dev -- sh

# Apply an overlay
kubectl apply -k k8s/overlays/prod/

# Check rollout status
kubectl rollout status deployment/prod-products-app -n products-app-prod

# Roll back a deployment
kubectl rollout undo deployment/prod-products-app -n products-app-prod

# Scale manually
kubectl scale deployment prod-products-app --replicas=3 -n products-app-prod

# View HPA status
kubectl get hpa -n products-app-prod

# View resource usage
kubectl top pods -n products-app-prod
```

---

## 10. Troubleshooting

### Pod in `CrashLoopBackOff`

```bash
kubectl describe pod <pod-name> -n products-app-dev
kubectl logs <pod-name> -n products-app-dev --previous
```

Common causes:
- Wrong database URL in ConfigMap
- Missing Secret
- App fails health check before `initialDelaySeconds`

### `ImagePullBackOff`

```bash
kubectl describe pod <pod-name> -n products-app-dev
```

Common causes:
- Wrong image name/tag in kustomization patch
- Registry credentials not set up: `kubectl create secret docker-registry`

### Pod stuck in `Pending`

```bash
kubectl describe pod <pod-name> -n products-app-dev
```

Common causes:
- Insufficient cluster resources (CPU/memory)
- PVC not bound (no StorageClass available)
- Node selector / affinity mismatch
