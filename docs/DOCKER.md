# Docker — Implementation Guide

This document explains every Docker decision made in this project: why we made it, how it works, and how to use it.

---

## Table of Contents

1. [Why Docker?](#1-why-docker)
2. [Dockerfile — Multi-Stage Build](#2-dockerfile--multi-stage-build)
3. [.dockerignore](#3-dockerignore)
4. [Docker Compose Files](#4-docker-compose-files)
5. [Image Layers & Caching Strategy](#5-image-layers--caching-strategy)
6. [Security Practices](#6-security-practices)
7. [Common Docker Commands](#7-common-docker-commands)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Why Docker?

Docker solves the classic "works on my machine" problem. By packaging the application with all its dependencies into a container image, we guarantee:

- **Consistency**: Identical runtime across DEV, TEST, and PROD.
- **Isolation**: The app cannot interfere with the host OS or other apps.
- **Portability**: The same image runs on any machine with Docker installed.
- **Reproducibility**: Every build from the same source code produces identical images.

---

## 2. Dockerfile — Multi-Stage Build

We use a **two-stage Dockerfile** to produce a small, secure, production-ready image.

### Stage 1 — Builder (`eclipse-temurin:17-jdk-alpine`)

```dockerfile
FROM eclipse-temurin:17-jdk-alpine AS builder
WORKDIR /workspace/app
COPY mvnw pom.xml ./
COPY .mvn .mvn
RUN ./mvnw dependency:go-offline -q   # Download deps (cached layer)
COPY src src
RUN ./mvnw package -DskipTests -q && \
    java -Djarmode=layertools -jar target/*.jar extract --destination target/extracted
```

**Why this approach:**
- We copy `pom.xml` and download dependencies **before** copying source code. Docker caches the `dependency:go-offline` layer. If only source code changes, Maven doesn't re-download 200+ jars.
- We use `layertools` (Spring Boot 2.3+) to extract the JAR into separate filesystem layers: `dependencies`, `spring-boot-loader`, `snapshot-dependencies`, `application`. Only the `application` layer changes with code — the others are cached.

### Stage 2 — Runtime (`eclipse-temurin:17-jre-alpine`)

```dockerfile
FROM eclipse-temurin:17-jre-alpine AS runtime
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app
COPY --from=builder /workspace/app/target/extracted/dependencies/ ./
COPY --from=builder /workspace/app/target/extracted/spring-boot-loader/ ./
COPY --from=builder /workspace/app/target/extracted/snapshot-dependencies/ ./
COPY --from=builder /workspace/app/target/extracted/application/ ./
```

**Why this approach:**
- Uses **JRE** (not JDK) — sheds ~200MB since we don't need compiler tools in production.
- Uses **Alpine Linux** — only ~5MB base image.
- Final image is typically **~180MB** vs ~500MB with a full JDK Debian image.
- The `COPY --from=builder` ensures **no build tools** (Maven, JDK compiler) end up in the runtime image.

### JVM Flags

```dockerfile
ENTRYPOINT ["java",
  "-XX:+UseContainerSupport",
  "-XX:MaxRAMPercentage=75.0",
  "-Djava.security.egd=file:/dev/./urandom",
  "org.springframework.boot.loader.launch.JarLauncher"]
```

| Flag | Why |
|------|-----|
| `-XX:+UseContainerSupport` | Makes JVM respect container CPU/memory limits (not host values) |
| `-XX:MaxRAMPercentage=75.0` | JVM heap uses max 75% of container memory limit |
| `-Djava.security.egd=...` | Faster random number generation (avoids SecureRandom blocking) |

### Health Check

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget -qO- http://localhost:8080/actuator/health/liveness || exit 1
```

Docker checks liveness every 30s after a 60s startup grace period. Three consecutive failures mark the container as unhealthy.

---

## 3. .dockerignore

Like `.gitignore` but for Docker build context. We exclude:

```
.git
target/
*.md
docs/
k8s/
```

This ensures the build context sent to the Docker daemon is minimal (~100KB of source vs megabytes otherwise), speeding up every `docker build`.

---

## 4. Docker Compose Files

We have three compose files — one per environment.

### `docker-compose.yml` (DEV)

- Runs PostgreSQL on port `5432` and the app on port `8080`.
- Builds image from local `Dockerfile`.
- Uses named volume `products_postgres_dev` (persists data between restarts).
- Uses `depends_on.condition: service_healthy` so the app only starts after PostgreSQL passes its health check.

```bash
docker compose up -d           # Start
docker compose logs -f app     # Follow app logs
docker compose down            # Stop (keeps volumes)
docker compose down -v         # Stop and remove volumes
```

### `docker-compose.test.yml` (TEST)

- PostgreSQL on port `5433` (avoids conflict with dev DB on same machine).
- App on port `8081`.
- Uses `restart: "no"` — containers don't auto-restart, making test results deterministic.

```bash
docker compose -f docker-compose.test.yml up --abort-on-container-exit
docker compose -f docker-compose.test.yml down -v
```

### `docker-compose.prod.yml` (PROD)

- Uses a **pre-built image** from registry (`IMAGE_NAME:IMAGE_TAG`), not local build.
- All credentials come from **environment variables** (set via `.env.prod` or CI/CD).
- 20GB PostgreSQL volume.
- Deploy replicas: 2 for high availability.
- Graceful rolling updates configured.

```bash
# Create .env.prod with real values (never commit this file)
cat > .env.prod <<EOF
POSTGRES_USER=prod_user
POSTGRES_PASSWORD=super_secret_password
IMAGE_NAME=registry.gitlab.com/your-namespace/spring-docker-k8s-demo
IMAGE_TAG=1.0.0
EOF

docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

---

## 5. Image Layers & Caching Strategy

```
Layer 1: OS (Alpine)              — never changes
Layer 2: JRE 17                   — changes only on Java upgrade
Layer 3: App dependencies (JARs)  — changes only on pom.xml change
Layer 4: Spring Boot loader       — rarely changes
Layer 5: Snapshot dependencies    — changes on SNAPSHOT version changes
Layer 6: Application code         — changes on every code change
```

Only Layer 6 changes for most commits. Docker pulls layers 1-5 from cache, making image builds and pushes very fast after the first time.

---

## 6. Security Practices

| Practice | Implementation |
|----------|---------------|
| Non-root user | `adduser -S appuser` runs the process as non-root |
| JRE only | Runtime stage uses JRE, no compiler |
| Alpine base | Minimal attack surface (~5MB OS) |
| No secrets in image | Credentials injected via environment variables at runtime |
| Health checks | Containers declare their own health status |
| Read-only filesystem | Can be added: `docker run --read-only` with `/tmp` tmpfs |

---

## 7. Common Docker Commands

```bash
# Build image manually
docker build -t spring-docker-k8s-demo:local .

# Run standalone (with external DB)
docker run -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=dev \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://host.docker.internal:5432/products_dev \
  -e SPRING_DATASOURCE_USERNAME=postgres \
  -e SPRING_DATASOURCE_PASSWORD=postgres \
  spring-docker-k8s-demo:local

# Inspect running container
docker exec -it products-app-dev sh

# View container logs
docker logs products-app-dev -f --tail=100

# Inspect image layers
docker history spring-docker-k8s-demo:local

# Check image size
docker images spring-docker-k8s-demo
```

---

## 8. Troubleshooting

### App starts but can't connect to PostgreSQL

```bash
# Check if postgres is healthy
docker compose ps

# Check postgres logs
docker compose logs postgres

# Test connection manually
docker exec -it products-postgres-dev psql -U postgres -d products_dev -c "\dt"
```

### Port already in use

```bash
# Find process using port 8080 (Windows)
netstat -ano | findstr :8080

# Find process using port 8080 (Linux/Mac)
lsof -i :8080
```

### Out of disk space from old images

```bash
docker system prune -a --volumes
```
