# How to Run the Project — Step-by-Step Guide

This document covers everything you need to check **before** running the project and the exact
steps to start the backend (Spring Boot) and frontend (React) together.

---

## Table of Contents

1. [Pre-flight Checklist](#1-pre-flight-checklist)
   - [Required Tools](#11-required-tools)
   - [Check for Port Conflicts](#12-check-for-port-conflicts)
   - [Check Docker is Running](#13-check-docker-is-running)
2. [Start the Project — Step by Step](#2-start-the-project--step-by-step)
   - [Step 1 — Start PostgreSQL](#step-1--start-postgresql-database)
   - [Step 2 — Start the Backend](#step-2--start-the-spring-boot-backend)
   - [Step 3 — Verify the Backend](#step-3--verify-the-backend-is-healthy)
   - [Step 4 — Start the Frontend](#step-4--start-the-react-frontend)
   - [Step 5 — Open in Browser](#step-5--open-in-your-browser)
3. [Stopping the Project](#3-stopping-the-project)
4. [Port Conflict — How to Fix](#4-port-conflict--how-to-fix)
5. [Quick Reference Card](#5-quick-reference-card)

---

## 1. Pre-flight Checklist

Run these checks **once before starting** the project every time.

---

### 1.1 Required Tools

Open a terminal and run each command. If any command fails, install the missing tool first.

#### Java 17+

```powershell
java -version
```

Expected output:
```
openjdk version "17.x.x" ...
```

If missing → download from https://adoptium.net/ (choose JDK 17, Windows x64)

---

#### Maven Wrapper

The project includes its own `mvnw` wrapper — no global Maven install needed.
Just verify the file exists:

```powershell
# From the project root
Test-Path .\mvnw.cmd
```

Expected output: `True`

---

#### Docker Desktop

```powershell
docker --version
docker info
```

Expected output:
```
Docker version 24.x.x ...
...Server: Docker Engine - Community ...
```

If Docker is not running → open **Docker Desktop** from the Start menu and wait for the whale icon
in the taskbar to stop animating (usually 30–60 seconds).

---

#### Node.js 18+

```powershell
node -v
```

Expected output: `v18.x.x` or higher (v20, v22 also fine)

If missing → download from https://nodejs.org/ (choose LTS version)

---

#### npm 9+

```powershell
npm -v
```

Expected output: `9.x.x` or higher

npm is installed automatically with Node.js.

---

#### Frontend dependencies installed

The `node_modules/` folder must exist before starting the frontend.
Check if it already exists:

```powershell
Test-Path .\frontend\node_modules
```

If the output is `False`, install dependencies first:

```powershell
cd frontend
npm install
cd ..
```

This only needs to be done **once** (or whenever `package.json` changes).

---

### 1.2 Check for Port Conflicts

The project uses three ports. If any are already occupied, the service will fail to start.

| Port | Used by |
|------|---------|
| `5432` | PostgreSQL database |
| `8080` | Spring Boot backend API |
| `3000` | React frontend dev server |

Run this single command to check all three at once:

```powershell
netstat -ano | Select-String ":5432 |:8080 |:3000 " | Select-String "LISTENING"
```

**Good output** (nothing blocking): the command returns no lines.

**Bad output** (something is blocking):
```
TCP    0.0.0.0:8080    0.0.0.0:0    LISTENING    12345
```

If a port is occupied, see [Section 4 — Port Conflict Fix](#4-port-conflict--how-to-fix) before continuing.

---

### 1.3 Check Docker is Running

```powershell
docker ps
```

**Good output** (Docker is running — even if no containers yet):
```
CONTAINER ID   IMAGE   COMMAND   CREATED   STATUS   PORTS   NAMES
```

**Bad output** (Docker is NOT running):
```
error during connect: ... Is the docker daemon running?
```

Fix: Open **Docker Desktop** and wait until it says "Docker Desktop is running".

---

## 2. Start the Project — Step by Step

Use **three separate terminal windows** — one for PostgreSQL/Docker, one for the backend,
and one for the frontend. This makes it easy to read logs independently.

---

### Step 1 — Start PostgreSQL Database

Open **Terminal 1** in the project root and run:

```powershell
docker compose up -d postgres
```

Wait for confirmation:
```
Container products-postgres-dev  Started
```

Verify PostgreSQL is healthy (wait up to 30 seconds):

```powershell
docker inspect products-postgres-dev --format "{{.State.Health.Status}}"
```

Expected: `healthy`

> PostgreSQL data is saved in a Docker volume (`products_postgres_dev`).
> It persists between restarts — your data is not lost when you stop.

---

### Step 2 — Start the Spring Boot Backend

Open **Terminal 2** in the project root and run:

```powershell
# Windows — PowerShell
$env:SPRING_PROFILES_ACTIVE   = "dev"
$env:SPRING_DATASOURCE_URL    = "jdbc:postgresql://localhost:5432/products_dev"
$env:SPRING_DATASOURCE_USERNAME = "postgres"
$env:SPRING_DATASOURCE_PASSWORD = "postgres"
.\mvnw spring-boot:run
```

Watch the logs. The backend is **ready** when you see this line:

```
Tomcat started on port 8080 (http) with context path '/'
Started SpringDockerK8sDemoApplication in XX.XXX seconds
```

**First-time startup** takes longer (~60–90 seconds) because Maven downloads dependencies.
Subsequent starts take ~30–40 seconds.

**What happens automatically on first start:**
- Flyway creates the `products` table in PostgreSQL
- 5 sample products are seeded into the database

---

### Step 3 — Verify the Backend is Healthy

In a new terminal, run:

```powershell
Invoke-RestMethod "http://localhost:8080/actuator/health"
```

Expected output:
```
status  groups              components
------  ------              ----------
UP      {liveness, readiness} @{db=; diskSpace=; ...}
```

The `db` component must also show `status: UP` — this confirms the API is connected to PostgreSQL.

---

### Step 4 — Start the React Frontend

Open **Terminal 3**, navigate into the `frontend` folder, and run:

```powershell
cd frontend
npm run dev
```

The frontend is **ready** when you see:

```
  VITE v5.4.x  ready in ~1800ms

  ➜  Local:   http://localhost:3000/
```

> The Vite dev server automatically proxies all `/api` and `/actuator` requests to
> `http://localhost:8080` — no extra configuration needed.

---

### Step 5 — Open in Your Browser

| What | URL |
|------|-----|
| **API Tester UI** (React app) | http://localhost:3000 |
| **Swagger UI** (auto-generated API docs) | http://localhost:8080/swagger-ui.html |
| **Health Check** | http://localhost:8080/actuator/health |
| **Raw API** | http://localhost:8080/api/v1/products |

---

## 3. Stopping the Project

### Stop the frontend
Go to **Terminal 3** (where `npm run dev` is running) and press `Ctrl + C`.

### Stop the backend
Go to **Terminal 2** (where `mvnw spring-boot:run` is running) and press `Ctrl + C`.
Wait for the graceful shutdown message:
```
Tomcat stopped.
```

### Stop PostgreSQL
```powershell
# Stop the container but KEEP the data
docker compose stop postgres

# OR stop AND remove the container (data volume is still preserved)
docker compose down

# OR stop AND delete ALL data (fresh start next time)
docker compose down -v
```

---

## 4. Port Conflict — How to Fix

If `netstat` shows a port is already in use, find and stop the blocking process.

### Find which process is using a port

```powershell
# Replace 8080 with whichever port is blocked
netstat -ano | Select-String ":8080 " | Select-String "LISTENING"
```

Note the PID in the last column (e.g., `12345`).

### Identify the process

```powershell
Get-Process -Id 12345 | Select-Object Id, ProcessName, CPU
```

### Kill it (if safe to do so)

```powershell
Stop-Process -Id 12345 -Force
```

### Common causes and fixes

| Port | Likely cause | Fix |
|------|-------------|-----|
| `8080` | Another Spring Boot app running in **IntelliJ IDEA** | Stop the app in IntelliJ (red stop button) |
| `8080` | Previous backend didn't shut down cleanly | `Stop-Process -Id <pid> -Force` |
| `3000` | Previous `npm run dev` still running | `Stop-Process -Id <pid> -Force` |
| `5432` | Local PostgreSQL installation (not Docker) | Stop the Windows PostgreSQL service: `Stop-Service postgresql*` |

---

## 5. Quick Reference Card

Copy and paste this for a fast startup every session:

```powershell
# ── Terminal 1: Start Database ──────────────────────────────────────────────
docker compose up -d postgres
docker inspect products-postgres-dev --format "{{.State.Health.Status}}"
# Wait for: healthy

# ── Terminal 2: Start Backend ───────────────────────────────────────────────
$env:SPRING_PROFILES_ACTIVE    = "dev"
$env:SPRING_DATASOURCE_URL     = "jdbc:postgresql://localhost:5432/products_dev"
$env:SPRING_DATASOURCE_USERNAME= "postgres"
$env:SPRING_DATASOURCE_PASSWORD= "postgres"
.\mvnw spring-boot:run
# Wait for: Started SpringDockerK8sDemoApplication in XX seconds

# ── Terminal 3: Start Frontend ──────────────────────────────────────────────
cd frontend
npm run dev
# Wait for: Local: http://localhost:3000/

# ── Browser ─────────────────────────────────────────────────────────────────
# API Tester  → http://localhost:3000
# Swagger UI  → http://localhost:8080/swagger-ui.html
# Health      → http://localhost:8080/actuator/health
```

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `Web server failed to start. Port 8080 was already in use` | Another app on 8080 | See [Section 4](#4-port-conflict--how-to-fix) |
| `FlywayException: Unable to obtain connection` | PostgreSQL not running or not healthy | Run Step 1 again, wait for `healthy` |
| `npm run dev` gives `ENOENT node_modules` | `npm install` not run | Run `cd frontend && npm install` |
| API calls in UI return `502 Bad Gateway` | Backend not running | Complete Step 2 first |
| `docker compose up` fails | Docker Desktop not running | Open Docker Desktop and wait for it to fully start |
| Backend starts but `db` health is `DOWN` | Wrong DB URL or credentials | Double-check the env vars in Step 2 |
