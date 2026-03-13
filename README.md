# Spring Boot CRUD — Docker & Kubernetes Demo

A **production-ready** Spring Boot 3.x REST API demonstrating a complete CRUD application with PostgreSQL, containerized with Docker, orchestrated with Kubernetes (Kustomize), and automated via GitLab CI/CD.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Quick Start](#quick-start)
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
| [docs/DOCKER.md](docs/DOCKER.md) | How Docker is set up, multi-stage build, compose files |
| [docs/KUBERNETES.md](docs/KUBERNETES.md) | K8s architecture, Kustomize overlays, secrets management |
| [docs/GITLAB-CICD.md](docs/GITLAB-CICD.md) | CI/CD pipeline stages, variables, approvals |
| [docs/HOW-TO-RUN.md](docs/HOW-TO-RUN.md) | Step-by-step guide to run in DEV, TEST, and PROD |
