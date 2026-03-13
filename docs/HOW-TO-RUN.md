# How to Run the Project — DEV, TEST, and PROD

This is the complete step-by-step guide to run the Spring Boot application in all three environments using three methods:
1. **Locally with Maven** (fastest for development)
2. **With Docker Compose** (close to real deployment)
3. **With Kubernetes** (production-grade)

---

## Prerequisites

| Tool | Minimum Version | Check |
|------|----------------|-------|
| Java JDK | 17 | `java -version` |
| Maven | 3.8 | `./mvnw -version` |
| Docker | 24 | `docker --version` |
| Docker Compose | 2.x | `docker compose version` |
| kubectl | 1.25+ | `kubectl version --client` |
| kustomize | Built into kubectl | `kubectl kustomize --help` |

---

## Method 1: Local Maven Run (No Docker)

### DEV Environment

**Step 1: Start PostgreSQL** (via Docker, quickest approach)

```bash
docker run -d \
  --name postgres-dev \
  -e POSTGRES_DB=products_dev \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:16-alpine
```

**Step 2: Run the application**

```bash
# Windows (PowerShell)
$env:SPRING_PROFILES_ACTIVE="dev"
./mvnw spring-boot:run

# Linux / macOS
SPRING_PROFILES_ACTIVE=dev ./mvnw spring-boot:run
```

**Step 3: Verify**

```bash
# Health check
curl http://localhost:8080/actuator/health

# Open Swagger UI
# Browser: http://localhost:8080/swagger-ui.html
```

**Step 4: Try CRUD operations**

```bash
# Create a product
curl -X POST http://localhost:8080/api/v1/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "MacBook Pro",
    "description": "Apple M3 chip",
    "price": 1999.99,
    "category": "Electronics",
    "stock": 25
  }'

# Get all products
curl http://localhost:8080/api/v1/products

# Get by ID (use the ID from the create response)
curl http://localhost:8080/api/v1/products/{id}

# Update product
curl -X PUT http://localhost:8080/api/v1/products/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "name": "MacBook Pro 14",
    "description": "Updated description",
    "price": 2199.99,
    "category": "Electronics",
    "stock": 20
  }'

# Update stock only
curl -X PATCH "http://localhost:8080/api/v1/products/{id}/stock?stock=50"

# Delete product (soft delete)
curl -X DELETE http://localhost:8080/api/v1/products/{id}
```

**Step 5: Stop**

```bash
# Stop the Spring Boot app: Ctrl+C
# Stop PostgreSQL
docker stop postgres-dev && docker rm postgres-dev
```

---

### TEST Environment

```bash
# Start PostgreSQL on port 5433 (avoids conflict with dev on 5432)
docker run -d \
  --name postgres-test \
  -e POSTGRES_DB=products_test \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5433:5432 \
  postgres:16-alpine

# Run with test profile
SPRING_PROFILES_ACTIVE=test ./mvnw spring-boot:run

# App runs on port 8081 (see application-test.yml)
curl http://localhost:8081/actuator/health
```

---

### Run Tests

```bash
# Unit tests only (no DB needed — uses mocks)
./mvnw test -Dtest="**/*Test,**/*ControllerTest" -DfailIfNoTests=false

# Integration tests only (uses Testcontainers — needs Docker running)
./mvnw test -Dtest="**/*IntegrationTest" -DfailIfNoTests=false

# All tests
./mvnw verify
```

---

## Method 2: Docker Compose

### DEV Environment

```bash
# Build and start all services
docker compose up -d

# Watch logs
docker compose logs -f app

# Verify health
curl http://localhost:8080/actuator/health

# Open Swagger UI
# Browser: http://localhost:8080/swagger-ui.html

# Stop everything (keep data)
docker compose down

# Stop and remove all data volumes
docker compose down -v
```

**What this starts:**
- PostgreSQL on `localhost:5432` with database `products_dev`
- Spring Boot app on `localhost:8080` with profile `dev`
- Both on internal Docker network `products-network-dev`

---

### TEST Environment

```bash
# Start test stack
docker compose -f docker-compose.test.yml up -d

# App runs on port 8081
curl http://localhost:8081/actuator/health

# Stop (and optionally remove volumes)
docker compose -f docker-compose.test.yml down -v
```

---

### PROD Environment (Single Server)

> **Warning:** Use Kubernetes for real production. This compose file is for a single-server production-like setup only.

**Step 1: Create environment file (NEVER commit this)**

```bash
cat > .env.prod << 'EOF'
POSTGRES_DB=products_prod
POSTGRES_USER=prod_user
POSTGRES_PASSWORD=MyStr0ngPr0dP@ssw0rd!
IMAGE_NAME=registry.gitlab.com/your-namespace/spring-docker-k8s-demo
IMAGE_TAG=1.0.0
EOF
```

**Step 2: Pull and run**

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d

# Check health
curl http://localhost:8080/actuator/health

# Monitor
docker compose -f docker-compose.prod.yml logs -f app
```

**Step 3: Zero-downtime update**

```bash
# Update IMAGE_TAG in .env.prod to new version
# Then rolling restart:
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --no-deps app
```

---

## Method 3: Kubernetes

### Prerequisites

```bash
# For local K8s: install minikube
minikube start --memory=4096 --cpus=2

# Enable ingress addon
minikube addons enable ingress

# For cloud K8s: ensure kubectl is configured
kubectl cluster-info
```

---

### DEV on Kubernetes

**Step 1: Create namespace and resources**

```bash
kubectl apply -k k8s/overlays/dev/
```

**Step 2: Verify pods are running**

```bash
kubectl get pods -n products-app-dev
# Expected:
# NAME                              READY   STATUS    RESTARTS   AGE
# dev-postgres-xxxxx                1/1     Running   0          2m
# dev-products-app-xxxxx-xxxxx      1/1     Running   0          90s
```

**Step 3: Access the application**

```bash
# Option A: Port-forward (quick access without Ingress)
kubectl port-forward service/dev-products-app-service 8080:80 -n products-app-dev
# Then: curl http://localhost:8080/actuator/health

# Option B: Via Ingress (add to /etc/hosts first)
# On minikube:
minikube ip  # e.g., 192.168.49.2
echo "192.168.49.2 api-dev.example.com" >> /etc/hosts
curl http://api-dev.example.com/actuator/health
```

**Step 4: View logs**

```bash
kubectl logs -f deployment/dev-products-app -n products-app-dev
```

**Step 5: Tear down**

```bash
kubectl delete -k k8s/overlays/dev/
```

---

### TEST on Kubernetes

```bash
# Deploy
kubectl apply -k k8s/overlays/test/

# Check
kubectl get pods -n products-app-test
kubectl get ingress -n products-app-test

# Access via port-forward
kubectl port-forward service/test-products-app-service 8081:80 -n products-app-test

# Remove
kubectl delete -k k8s/overlays/test/
```

---

### PROD on Kubernetes

> **Important:** Before deploying to production, replace placeholder secrets with real values!

**Step 1: Create real production secret (from CI/CD or manually)**

```bash
# Never use the placeholder secret.yml for production!
kubectl create secret generic prod-app-secret \
  --from-literal=POSTGRES_USER="$PROD_DB_USER" \
  --from-literal=POSTGRES_PASSWORD="$PROD_DB_PASSWORD" \
  --namespace=products-app-prod \
  --dry-run=client -o yaml | kubectl apply -f -
```

**Step 2: Update the image tag in prod overlay**

Edit `k8s/overlays/prod/kustomization.yml` — replace the image tag with the desired production version.

```bash
# Or use kustomize edit (if kustomize CLI is installed)
cd k8s/overlays/prod
kustomize edit set image \
  registry.gitlab.com/your-namespace/spring-docker-k8s-demo:1.0.0
```

**Step 3: Deploy**

```bash
kubectl apply -k k8s/overlays/prod/

# Wait for rollout
kubectl rollout status deployment/prod-products-app \
  -n products-app-prod \
  --timeout=600s
```

**Step 4: Verify**

```bash
kubectl get pods -n products-app-prod
kubectl get hpa -n products-app-prod
kubectl get ingress -n products-app-prod

# Check logs
kubectl logs -f deployment/prod-products-app -n products-app-prod
```

**Step 5: Roll back if needed**

```bash
kubectl rollout undo deployment/prod-products-app -n products-app-prod
kubectl rollout status deployment/prod-products-app -n products-app-prod --timeout=300s
```

---

## Environment Comparison Summary

| Aspect | DEV | TEST | PROD |
|--------|-----|------|------|
| Profile | `dev` | `test` | `prod` |
| DB Name | `products_dev` | `products_test` | `products_prod` |
| App Port | `8080` | `8081` | `8080` |
| Postgres Port | `5432` | `5433` | internal |
| SQL Logging | Yes | No | No |
| Swagger UI | Yes | Yes | **No** |
| Replicas (K8s) | 1 | 1 | 2 (HPA: 2-10) |
| DB Volume | `5Gi` | `5Gi` | `20Gi` |
| Credentials | Hardcoded (dev) | Hardcoded (dev) | Environment vars |
| Graceful shutdown | No | No | 60s |

---

## Useful Commands Reference

```bash
# ── Maven ──────────────────────────────────────────────────────────────────
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev  # Run with profile
./mvnw test                                             # All tests
./mvnw package -DskipTests                              # Build JAR only
./mvnw dependency:tree                                  # View dependency tree

# ── Docker ──────────────────────────────────────────────────────────────────
docker compose up -d                                    # Start DEV
docker compose logs -f app                              # App logs
docker compose exec postgres psql -U postgres -d products_dev  # DB shell

# ── Kubernetes ──────────────────────────────────────────────────────────────
kubectl apply -k k8s/overlays/dev/                     # Deploy DEV
kubectl get all -n products-app-dev                     # All resources
kubectl port-forward svc/dev-products-app-service 8080:80 -n products-app-dev
kubectl rollout restart deployment/dev-products-app -n products-app-dev
```

---

## Troubleshooting

### Application fails to start — `FlywayException: Unable to obtain connection`

Database is not ready or wrong credentials. Check:
```bash
# Docker Compose
docker compose logs postgres

# Kubernetes
kubectl describe pod <postgres-pod> -n products-app-dev
```

### Port 8080 is already in use (Windows)

```powershell
netstat -ano | findstr :8080
# Note the PID from the last column
taskkill /PID <PID> /F
```

### Flyway migration fails on startup

```bash
# The db/migration scripts may have already run. Check:
docker compose exec postgres psql -U postgres -d products_dev \
  -c "SELECT version, description, success FROM flyway_schema_history ORDER BY installed_rank;"
```

### Kubernetes pod keeps restarting

```bash
kubectl describe pod <pod-name> -n products-app-dev
kubectl logs <pod-name> -n products-app-dev --previous
```

Check the `Events` section at the bottom of `describe` output for the root cause.
