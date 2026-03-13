# GitLab CI/CD — Implementation Guide

This document explains the complete GitLab CI/CD pipeline: every stage, the reasoning behind it, required variables, and how to configure it in your GitLab project.

---

## Table of Contents

1. [Pipeline Overview](#1-pipeline-overview)
2. [Stage-by-Stage Breakdown](#2-stage-by-stage-breakdown)
3. [Branch Strategy](#3-branch-strategy)
4. [Required CI/CD Variables](#4-required-cicd-variables)
5. [Docker Image Build & Caching](#5-docker-image-build--caching)
6. [Kubernetes Deployment from CI/CD](#6-kubernetes-deployment-from-cicd)
7. [Environment Protection Rules](#7-environment-protection-rules)
8. [Artifact Reports](#8-artifact-reports)
9. [Setting Up GitLab CI/CD from Scratch](#9-setting-up-gitlab-cicd-from-scratch)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Pipeline Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         GitLab CI/CD Pipeline                            │
├──────────────┬──────────────┬─────────────┬──────────┬──────────────────┤
│   validate   │     test     │    build    │ publish  │     deploy       │
├──────────────┼──────────────┼─────────────┼──────────┼──────────────────┤
│  • compile   │ • unit-tests │ build-image │ publish  │  deploy-dev  ✅  │
│  • checkstyle│ • integration│             │ -image   │  deploy-test ✅  │
│              │   -tests     │             │          │  deploy-prod 🔒  │
└──────────────┴──────────────┴─────────────┴──────────┴──────────────────┘
                                                              ✅ = automatic
                                                              🔒 = manual approval
```

**Full pipeline duration:** ~8-12 minutes (compile: 1m, tests: 3m, build: 3m, deploy: 2m)

---

## 2. Stage-by-Stage Breakdown

### Stage 1: `validate`

**Jobs:** `compile`, `checkstyle`

**Purpose:** Fast feedback. Catches syntax errors and code style violations before running expensive tests.

```yaml
compile:
  script:
    - ./mvnw $MAVEN_CLI_OPTS compile
```

**When it runs:**
- On every Merge Request
- On pushes to `main` and `develop` branches

**Duration:** ~60 seconds

---

### Stage 2: `test`

**Jobs:** `unit-tests`, `integration-tests`

#### `unit-tests`

Runs `@WebMvcTest` and `@ExtendWith(MockitoExtension.class)` tests. Uses a PostgreSQL **service container** (GitLab's built-in sidecar) — no Testcontainers needed because GitLab runs a real PostgreSQL alongside the test runner.

```yaml
services:
  - name: postgres:16-alpine
    alias: postgres
    variables:
      POSTGRES_DB: products_test
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
variables:
  SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/products_test
```

**Test reports** are published as JUnit XML artifacts, visible in GitLab's Test tab.

#### `integration-tests`

Runs `@Testcontainers` tests. These tests spin up a PostgreSQL Docker container **inside the test** using Testcontainers. This requires Docker-in-Docker (DinD):

```yaml
services:
  - name: docker:24-dind
    alias: docker
variables:
  DOCKER_HOST: tcp://docker:2376
  DOCKER_TLS_VERIFY: "1"
```

**Why both?**
- Unit tests run on every branch for fast feedback
- Integration tests run only on `main`/`develop` because they're slower (~2-3 min) and require DinD

---

### Stage 3: `build`

**Job:** `build-image`

Builds the Docker image using the project Dockerfile:

```yaml
image: docker:24-cli
services:
  - docker:24-dind
script:
  - docker build --pull --cache-from $IMAGE_NAME:$TAG -t $IMAGE_NAME:$TAG ...
```

**Image tagging strategy:**

| Branch | Image Tag |
|--------|-----------|
| `main` | `latest` + `$CI_COMMIT_SHA` |
| `develop` | `dev` + `$CI_COMMIT_SHA` |
| Feature branch | `$CI_COMMIT_REF_SLUG` |

We always tag with SHA for precise rollbacks:
```bash
# Roll back to a specific commit
docker pull registry.gitlab.com/your-ns/app:abc123def456
```

**Cache optimization:** `--cache-from` pulls the previous image's layers from the registry before building, so only changed layers are rebuilt.

**Artifact:** `.env` file with `IMAGE_TAG` and `IMAGE_SHA` passed to next stages via `dotenv` report.

---

### Stage 4: `publish`

**Job:** `publish-image`

Pushes the built image to **GitLab Container Registry**:

```yaml
script:
  - docker push $IMAGE_NAME:$IMAGE_TAG   # e.g., :latest
  - docker push $IMAGE_NAME:$IMAGE_SHA   # e.g., :abc123
```

GitLab Container Registry is automatically available at `registry.gitlab.com/your-namespace/your-project`.

No external registry configuration needed — `$CI_REGISTRY`, `$CI_REGISTRY_USER`, and `$CI_REGISTRY_PASSWORD` are predefined GitLab variables.

---

### Stage 5-7: `deploy-dev`, `deploy-test`, `deploy-prod`

All deploy jobs use `bitnami/kubectl` image and:

1. Write the kubeconfig from a base64-encoded CI/CD secret variable
2. Run `kubectl apply -k k8s/overlays/<env>/`
3. Wait for rollout to complete

```yaml
before_script:
  - mkdir -p ~/.kube
  - echo "$KUBE_CONFIG_DEV" | base64 -d > ~/.kube/config
script:
  - kubectl apply -k k8s/overlays/dev/
  - kubectl rollout status deployment/dev-products-app -n products-app-dev --timeout=300s
```

#### Deployment Promotion

```
develop branch push → deploy-dev (automatic)
main branch push    → deploy-dev → deploy-test (automatic) → deploy-prod (manual 🔒)
```

---

## 3. Branch Strategy

```
main ──────────────────────────────────────────────── (protected, full pipeline)
  │
  └─ develop ────────────────────────────────────────── (auto deploy to dev)
       │
       └─ feature/add-category-endpoint ───────────── (validate + unit tests only)
       └─ fix/stock-validation-bug ────────────────── (validate + unit tests only)
```

| Branch | Pipeline Scope | Deploy Target |
|--------|---------------|---------------|
| `feature/*` | validate, unit-tests | — |
| `develop` | full pipeline | DEV |
| `main` | full pipeline | DEV → TEST → PROD (manual) |

**Merge Request pipeline** runs on the source branch when an MR is opened.

---

## 4. Required CI/CD Variables

Set these in **GitLab → Settings → CI/CD → Variables**:

| Variable | Type | Description |
|----------|------|-------------|
| `KUBE_CONFIG_DEV` | Variable (masked) | base64-encoded kubeconfig for DEV cluster |
| `KUBE_CONFIG_TEST` | Variable (masked) | base64-encoded kubeconfig for TEST cluster |
| `KUBE_CONFIG_PROD` | Variable (masked) | base64-encoded kubeconfig for PROD cluster |
| `PROD_DB_USER` | Variable (masked) | Production database username |
| `PROD_DB_PASSWORD` | Variable (masked, protected) | Production database password |

**Auto-provided by GitLab (no setup needed):**

| Variable | Value |
|----------|-------|
| `CI_REGISTRY` | `registry.gitlab.com` |
| `CI_REGISTRY_USER` | GitLab username |
| `CI_REGISTRY_PASSWORD` | Registry token |
| `CI_REGISTRY_IMAGE` | Full image path |
| `CI_COMMIT_SHA` | Current commit SHA |
| `CI_COMMIT_BRANCH` | Branch name |

### How to create KUBE_CONFIG_DEV

```bash
# On your local machine, with kubectl configured for dev cluster:
cat ~/.kube/config | base64 -w 0
# Paste the output as the KUBE_CONFIG_DEV variable value in GitLab
```

---

## 5. Docker Image Build & Caching

### Registry-based layer caching

```yaml
docker build --pull --cache-from $IMAGE_NAME:$TAG ...
```

`--cache-from` tells Docker to download the previous image from the registry and use its layers as a build cache. This makes subsequent builds ~3-5x faster.

### Maven dependency caching

```yaml
cache:
  key:
    files:
      - pom.xml
  paths:
    - .m2/repository
  policy: pull-push
```

Maven dependencies are cached in GitLab's distributed cache keyed by `pom.xml` hash. Only regenerated when `pom.xml` changes. Saves ~60-90 seconds per pipeline.

---

## 6. Kubernetes Deployment from CI/CD

### Authentication

GitLab connects to Kubernetes clusters via kubeconfig. We store the kubeconfig as a masked CI/CD variable and write it to `~/.kube/config` in the job.

For production clusters, consider using **GitLab Agent for Kubernetes** (`gitlab-agent`) which is the modern, pull-based alternative:

```yaml
# Using GitLab Agent (alternative approach)
deploy-prod:
  script:
    - kubectl config use-context your-agent-context
    - kubectl apply -k k8s/overlays/prod/
```

### Rollout wait

```bash
kubectl rollout status deployment/prod-products-app \
  -n products-app-prod \
  --timeout=300s
```

This command **blocks** until all pods are running with the new image, or fails the job if the timeout is exceeded. This prevents the pipeline from marking a deployment as successful when pods are still crashing.

---

## 7. Environment Protection Rules

In **GitLab → Deployments → Environments**, configure:

| Environment | Protected | Deployment Approvers |
|-------------|-----------|---------------------|
| `development` | No | — |
| `test` | Yes | Any developer |
| `production` | Yes | Senior engineers only |

Protected environments prevent:
- Manual deployment by unauthorized users
- Accidental overwrites of production

---

## 8. Artifact Reports

Test results are uploaded as JUnit XML artifacts and displayed natively in GitLab MR Test tab:

```yaml
artifacts:
  reports:
    junit: target/surefire-reports/TEST-*.xml
```

Build environment is passed between stages using dotenv artifacts:

```yaml
artifacts:
  reports:
    dotenv: build.env   # Contains IMAGE_TAG and IMAGE_SHA
```

---

## 9. Setting Up GitLab CI/CD from Scratch

1. **Push the project** to a GitLab repository
2. **Enable Container Registry**: Settings → Packages & Registries → Container Registry
3. **Add CI/CD variables**: Settings → CI/CD → Variables (see table above)
4. **Create Kubernetes namespaces** on your cluster:
   ```bash
   kubectl create namespace products-app-dev
   kubectl create namespace products-app-test
   kubectl create namespace products-app-prod
   ```
5. **Apply RBAC** for the CI/CD service account to deploy to each namespace
6. **Replace placeholder** `your-namespace` in `k8s/` files with your GitLab namespace
7. **Push to `develop`** — pipeline will start automatically

---

## 10. Troubleshooting

### Pipeline fails at `compile` — Maven not found

The pipeline uses `eclipse-temurin:17-jdk-alpine` which doesn't have Maven pre-installed. We use the **Maven wrapper** (`./mvnw`) which downloads Maven on first use.

```bash
# If mvnw has no execute permissions
chmod +x mvnw
git add mvnw
git commit -m "fix: make mvnw executable"
```

### `docker: command not found` in test stage

The `unit-tests` job runs in a JDK image (no Docker). Integration tests use `docker:24-dind` as a service. If your test incorrectly runs in unit-tests, move it to the `integration-tests` job.

### `kubectl apply` fails — Unauthorized

```bash
# Check the kubeconfig is valid
echo $KUBE_CONFIG_DEV | base64 -d | kubectl --kubeconfig /dev/stdin cluster-info
```

Regenerate the kubeconfig if it has expired tokens.

### Deployment times out

Increase `--timeout` in rollout status, or investigate with:
```bash
kubectl describe deployment/dev-products-app -n products-app-dev
kubectl get events -n products-app-dev --sort-by=.lastTimestamp
```
