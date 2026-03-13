# Spring Boot CRUD — Docker & Kubernetes Demo

A **production-ready** Spring Boot 3.x REST API demonstrating a complete CRUD application with PostgreSQL, containerized with Docker, orchestrated with Kubernetes (Kustomize), and automated via GitLab CI/CD.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Quick Start](#quick-start)
- [Running Without Kubernetes](#running-without-kubernetes)
- [Environments](#environments)
- [Documentation](#documentation)

---

## Architecture Overview

```
┌─────────────┐    ┌─────────────────────────────┐    ┌────────────┐
│   Client    │───▶│  Spring Boot REST API        │───▶│ PostgreSQL │
│ (Browser /  │    │  (Products CRUD)             │    │  Database  │
│  Swagger)   │    │  Port: 8080                  │    │  Port:5432 │
└─────────────┘    └─────────────────────────────┘    └────────────┘
                            │
                   ┌────────▼────────┐
                   │  Actuator       │
                   │  /health        │
                   │  /metrics       │
                   │  /prometheus    │
                   └─────────────────┘
```

**Kubernetes deployment flow:**
```
GitLab CI/CD ──▶ Build Image ──▶ Push to Registry
                                        │
              ┌─────────────────────────┼──────────────────────┐
              ▼                         ▼                      ▼
        DEV Cluster               TEST Cluster           PROD Cluster
     (auto deploy)             (auto on main)        (manual approval)
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | Java 17 |
| Framework | Spring Boot 3.4.x |
| ORM | Spring Data JPA + Hibernate |
| Database | PostgreSQL 16 |
| Migrations | Flyway |
| Validation | Jakarta Validation (Bean Validation 3.0) |
| Documentation | SpringDoc OpenAPI 3 / Swagger UI |
| Monitoring | Spring Actuator + Prometheus |
| Container | Docker (multi-stage build) |
| Orchestration | Kubernetes + Kustomize |
| CI/CD | GitLab CI/CD |
| Testing | JUnit 5 + Mockito + Testcontainers |
| Build Tool | Maven |
| Utilities | Lombok |

---

## Project Structure

```
spring-docker-k8s-demo/
├── src/
│   ├── main/
│   │   ├── java/com/example/springdockerk8sdemo/
│   │   │   ├── SpringDockerK8sDemoApplication.java   # Entry point
│   │   │   ├── config/
│   │   │   │   └── OpenApiConfig.java                # Swagger config
│   │   │   ├── controller/
│   │   │   │   └── ProductController.java            # REST endpoints
│   │   │   ├── dto/
│   │   │   │   ├── ProductRequest.java               # Input DTO + validation
│   │   │   │   ├── ProductResponse.java              # Output DTO
│   │   │   │   ├── ApiResponse.java                  # Standard wrapper
│   │   │   │   └── PagedResponse.java               # Paginated wrapper
│   │   │   ├── entity/
│   │   │   │   └── Product.java                     # JPA entity
│   │   │   ├── exception/
│   │   │   │   ├── GlobalExceptionHandler.java       # @RestControllerAdvice
│   │   │   │   ├── ResourceNotFoundException.java
│   │   │   │   └── ErrorResponse.java
│   │   │   ├── repository/
│   │   │   │   └── ProductRepository.java           # Spring Data JPA
│   │   │   └── service/
│   │   │       ├── ProductService.java              # Interface
│   │   │       └── ProductServiceImpl.java          # Implementation
│   │   └── resources/
│   │       ├── application.yml                      # Common config
│   │       ├── application-dev.yml                  # DEV overrides
│   │       ├── application-test.yml                 # TEST overrides
│   │       ├── application-prod.yml                 # PROD overrides
│   │       └── db/migration/
│   │           └── V1__create_products_table.sql    # Flyway migration
│   └── test/
│       ├── java/com/example/springdockerk8sdemo/
│       │   ├── service/ProductServiceTest.java      # Unit tests
│       │   ├── controller/ProductControllerTest.java # Slice tests
│       │   └── integration/ProductIntegrationTest.java # Testcontainers
│       └── resources/application.yml
├── k8s/
│   ├── base/                                        # Shared K8s manifests
│   │   ├── namespace.yml
│   │   ├── deployment.yml
│   │   ├── service.yml
│   │   ├── ingress.yml
│   │   ├── postgres-deployment.yml
│   │   ├── postgres-service.yml
│   │   ├── postgres-pvc.yml
│   │   └── kustomization.yml
│   └── overlays/
│       ├── dev/                                     # DEV-specific config
│       ├── test/                                    # TEST-specific config
│       └── prod/                                    # PROD-specific config (HPA)
├── docs/
│   ├── DOCKER.md                                   # Docker guide
│   ├── KUBERNETES.md                               # Kubernetes guide
│   ├── GITLAB-CICD.md                              # CI/CD guide
│   └── HOW-TO-RUN.md                              # Running in all envs
├── Dockerfile                                       # Multi-stage build
├── docker-compose.yml                               # DEV compose
├── docker-compose.test.yml                          # TEST compose
├── docker-compose.prod.yml                          # PROD compose
├── .gitlab-ci.yml                                   # CI/CD pipeline
└── pom.xml
```

---

## API Endpoints

Base URL: `http://localhost:8080/api/v1`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/products` | Create a new product |
| `GET` | `/products` | Get all products (paginated) |
| `GET` | `/products/{id}` | Get product by ID |
| `GET` | `/products/search?search=keyword` | Search by name/category |
| `GET` | `/products/category/{category}` | Get by category |
| `PUT` | `/products/{id}` | Full update |
| `PATCH` | `/products/{id}/stock?stock=50` | Update stock only |
| `DELETE` | `/products/{id}` | Soft-delete (mark inactive) |

**Utility Endpoints:**

| Endpoint | Description |
|----------|-------------|
| `GET /swagger-ui.html` | Swagger UI (dev/test only) |
| `GET /api-docs` | OpenAPI JSON spec |
| `GET /actuator/health` | Application health |
| `GET /actuator/health/liveness` | Kubernetes liveness probe |
| `GET /actuator/health/readiness` | Kubernetes readiness probe |
| `GET /actuator/metrics` | Application metrics |

---

## Quick Start

### Prerequisites
- Java 17+
- Maven 3.8+
- Docker & Docker Compose
- (Optional) kubectl + a Kubernetes cluster

### Run locally with Docker Compose
```bash
# Clone and start DEV environment
docker compose up -d

# Check application health
curl http://localhost:8080/actuator/health

# Open Swagger UI
open http://localhost:8080/swagger-ui.html
```

---

## Running Without Kubernetes

You do not need Kubernetes to run this project. Two simpler options are available depending on your setup.

### Option 1: Maven Only (fastest for local dev)

Requires only Java 17+ and a running PostgreSQL instance.

**Step 1 — Start PostgreSQL via Docker (one-liner):**

```bash
docker run -d --name postgres-dev \
  -e POSTGRES_DB=products_dev \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:16-alpine
```

**Step 2 — Run the application:**

```bash
# Windows (PowerShell)
$env:SPRING_PROFILES_ACTIVE="dev"
./mvnw spring-boot:run

# Linux / macOS
SPRING_PROFILES_ACTIVE=dev ./mvnw spring-boot:run
```

**Step 3 — Verify:**

```bash
curl http://localhost:8080/actuator/health
# Browser: http://localhost:8080/swagger-ui.html
```

**Step 4 — Stop:**

```bash
# Ctrl+C to stop the app, then:
docker stop postgres-dev && docker rm postgres-dev
```

---

### Option 2: Docker Compose (recommended without K8s)

Requires only Docker & Docker Compose. No Java, no Maven, no PostgreSQL installation needed.

#### DEV

```bash
docker compose up -d

# Follow logs
docker compose logs -f app

# Verify
curl http://localhost:8080/actuator/health

# Open Swagger UI → http://localhost:8080/swagger-ui.html

# Stop (preserves DB data)
docker compose down

# Stop and wipe all data
docker compose down -v
```

#### TEST

```bash
docker compose -f docker-compose.test.yml up -d

curl http://localhost:8081/actuator/health

docker compose -f docker-compose.test.yml down -v
```

#### PROD (single-server, no K8s)

```bash
# Create a .env.prod file with real credentials (never commit this file)
cat > .env.prod <<'EOF'
POSTGRES_DB=products_prod
POSTGRES_USER=prod_user
POSTGRES_PASSWORD=YourStrongPassword!
IMAGE_NAME=registry.gitlab.com/your-namespace/spring-docker-k8s-demo
IMAGE_TAG=1.0.0
EOF

docker compose -f docker-compose.prod.yml --env-file .env.prod up -d

curl http://localhost:8080/actuator/health
```

---

### Quick Comparison — Which Option to Choose?

| Situation | Recommended Approach |
|-----------|---------------------|
| Writing & testing code locally | Maven only (`./mvnw spring-boot:run`) |
| Sharing a running environment with teammates | Docker Compose (`docker compose up -d`) |
| Running all environments on a single server | Docker Compose (`docker-compose.prod.yml`) |
| Multi-server, auto-scaling, high availability | Kubernetes (see [docs/KUBERNETES.md](docs/KUBERNETES.md)) |
| CI/CD automated deploys | GitLab pipeline (see [docs/GITLAB-CICD.md](docs/GITLAB-CICD.md)) |

> For full step-by-step instructions for every method and environment, see [docs/HOW-TO-RUN.md](docs/HOW-TO-RUN.md).

---

## Environments

| Environment | Profile | Port | DB |
|-------------|---------|------|----|
| Development | `dev` | 8080 | `products_dev` |
| Test | `test` | 8081 | `products_test` |
| Production | `prod` | 8080 | `products_prod` |

See [docs/HOW-TO-RUN.md](docs/HOW-TO-RUN.md) for detailed instructions for each environment.

---

## Documentation

| Document | Description |
|----------|-------------|
| [docs/RUNNING.md](docs/RUNNING.md) | **Start here** — pre-flight checks + step-by-step run guide for backend & frontend |
| [docs/DOCKER.md](docs/DOCKER.md) | How Docker is set up, multi-stage build, compose files |
| [docs/KUBERNETES.md](docs/KUBERNETES.md) | K8s architecture, Kustomize overlays, secrets management |
| [docs/GITLAB-CICD.md](docs/GITLAB-CICD.md) | CI/CD pipeline stages, variables, approvals |
| [docs/HOW-TO-RUN.md](docs/HOW-TO-RUN.md) | Step-by-step guide to run in DEV, TEST, and PROD environments |
