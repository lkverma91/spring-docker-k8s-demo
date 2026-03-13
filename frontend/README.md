# Spring API Tester — React Frontend

An interactive browser UI to test every endpoint of the Spring Boot Products CRUD API.
No Postman, no curl — just click a button, fill a form, and see the live JSON response.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [How to Run](#how-to-run)
- [How to Clean](#how-to-clean)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [How the Proxy Works](#how-the-proxy-works)
- [UI Panels Reference](#ui-panels-reference)
- [Tech Stack](#tech-stack)

---

## Prerequisites

| Tool | Version | Check |
|------|---------|-------|
| Node.js | 18+ | `node -v` |
| npm | 9+ | `npm -v` |
| Spring Boot backend | running on port 8080 | `curl http://localhost:8080/actuator/health` |

> The frontend **only works when the Spring Boot backend is running**. Start the backend first.
> See the root [README.md](../README.md) or [docs/HOW-TO-RUN.md](../docs/HOW-TO-RUN.md) for backend setup.

---

## How to Run

All commands must be run from inside the `frontend/` directory.

### Step 1 — Install dependencies (first time only)

```bash
cd frontend
npm install
```

This downloads all packages into `node_modules/` and creates `package-lock.json`.

### Step 2 — Start the dev server

```bash
npm run dev
```

Output you should see:

```
  VITE v5.4.x  ready in ~700ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Step 3 — Make sure the backend is running

In a **separate terminal**, start the Spring Boot backend:

```bash
# Option A — Maven
cd ..
$env:SPRING_PROFILES_ACTIVE="dev"   # PowerShell
./mvnw spring-boot:run

# Option B — Docker Compose (from project root)
docker compose up -d
```

Once both are running, every button in the UI sends a real HTTP request to `http://localhost:8080`.

---

## How to Clean

### Remove build output only

```bash
# Windows (PowerShell)
Remove-Item -Recurse -Force dist

# Linux / macOS
rm -rf dist
```

### Remove installed packages (full clean)

```bash
# Windows (PowerShell)
Remove-Item -Recurse -Force node_modules

# Linux / macOS
rm -rf node_modules
```

### Full reset — remove everything generated

```bash
# Windows (PowerShell)
Remove-Item -Recurse -Force node_modules, dist

# Linux / macOS
rm -rf node_modules dist
```

After a full reset, run `npm install` again before starting the dev server.

### Re-install from scratch

```bash
# Remove everything generated
Remove-Item -Recurse -Force node_modules, dist   # Windows
rm -rf node_modules dist                          # Linux/macOS

# Re-install
npm install

# Start again
npm run dev
```

---

## Available Scripts

Run these from the `frontend/` directory:

| Command | What it does |
|---------|-------------|
| `npm install` | Install all dependencies into `node_modules/` |
| `npm run dev` | Start Vite dev server at `http://localhost:3000` with hot-reload |
| `npm run build` | Compile and bundle for production into `dist/` |
| `npm run preview` | Serve the production `dist/` build locally for final check |

---

## Project Structure

```
frontend/
│
├── index.html                  # HTML entry point — mounts the React app
├── package.json                # Project metadata, scripts, and dependencies
├── package-lock.json           # Exact dependency versions (auto-generated, commit this)
├── vite.config.js              # Vite config — port 3000, API proxy rules
├── tailwind.config.js          # Tailwind CSS config — scans src/ for class names
├── postcss.config.js           # PostCSS config — required by Tailwind
│
├── node_modules/               # Installed packages (generated — do NOT commit)
├── dist/                       # Production build output (generated — do NOT commit)
│
└── src/
    │
    ├── main.jsx                # React entry point — renders <App /> into #root
    ├── App.jsx                 # Root component — sidebar navigation + panel switcher
    ├── index.css               # Global styles — Tailwind directives + scrollbar overrides
    │
    ├── api/
    │   └── productApi.js       # All API call functions (one per endpoint)
    │                           # Each call captures: status, duration, body, method, URL
    │
    ├── hooks/
    │   └── useApiCall.js       # Generic React hook — wraps any API fn with
    │                           # loading / result state management
    │
    └── components/
        │
        ├── ── Shared UI ──
        ├── Section.jsx         # Card wrapper — shows method badge + endpoint URL header
        ├── Field.jsx           # Labeled input or textarea with hint text
        ├── SendButton.jsx      # Styled submit button with loading spinner (5 color variants)
        ├── ResponseViewer.jsx  # Shows JSON response: status, timing, body, Copy button
        │
        ├── ── API Panels ──
        ├── HealthCheck.jsx     # GET  /actuator/health
        ├── ProductCreate.jsx   # POST /api/v1/products         (form + sample data button)
        ├── ProductList.jsx     # GET  /api/v1/products         (pagination + sort controls)
        ├── ProductGetById.jsx  # GET  /api/v1/products/{id}    (UUID input)
        ├── ProductSearch.jsx   # GET  /api/v1/products/search  (keyword + pagination)
        ├── ProductByCategory.jsx # GET /api/v1/products/category/{cat} (quick-select pills)
        ├── ProductUpdate.jsx   # PUT  /api/v1/products/{id}    (load current + edit form)
        ├── ProductStock.jsx    # PATCH /api/v1/products/{id}/stock  (quick-set 0/10/50/100)
        └── ProductDelete.jsx   # DELETE /api/v1/products/{id}  (confirmation checkbox)
```

### What each file does

#### `src/api/productApi.js`
Central API layer. Each function:
- Accepts typed parameters
- Uses Axios under the hood
- Returns a **structured result object** (never throws) containing:
  - `ok` — whether the request succeeded
  - `status` / `statusText` — HTTP status code
  - `data` — parsed response body
  - `durationMs` — how long the request took
  - `method` / `url` — for display in `ResponseViewer`

#### `src/hooks/useApiCall.js`
A single reusable hook used by every panel component:
```js
const { execute, result, loading } = useApiCall(createProduct)
```
- `execute(...args)` — calls the API function, sets loading state
- `result` — the structured result object (null until first call)
- `loading` — boolean, true while request is in flight

#### `src/components/ResponseViewer.jsx`
Renders the API result as:
- A **meta bar** — method badge, URL, colored status code, duration
- A **dark code block** — formatted JSON with a Copy to clipboard button

#### `src/App.jsx`
Manages which panel is active via `useState`. The sidebar renders a nav button per endpoint; clicking switches the panel rendered in the main content area.

---

## How the Proxy Works

In development, Vite proxies requests so the browser never hits CORS restrictions:

```
Browser (localhost:3000)
  ↓ fetch('/api/v1/products')
Vite Dev Server (localhost:3000)
  ↓ proxied to → http://localhost:8080/api/v1/products
Spring Boot Backend (localhost:8080)
```

This is configured in `vite.config.js`:

```js
server: {
  port: 3000,
  proxy: {
    '/api':      { target: 'http://localhost:8080', changeOrigin: true },
    '/actuator': { target: 'http://localhost:8080', changeOrigin: true },
  },
}
```

No CORS headers need to be configured on the backend for local development.

> In production (after `npm run build`), the `dist/` folder is served as static files.
> You would typically serve it from nginx or a CDN and point it at the backend's real URL.

---

## UI Panels Reference

| Sidebar Item | Method | Endpoint | Special Features |
|-------------|--------|----------|-----------------|
| Health Check | `GET` | `/actuator/health` | One-click, no inputs |
| Create Product | `POST` | `/api/v1/products` | Full form, "Fill sample data" shortcut |
| Get All Products | `GET` | `/api/v1/products` | Page, size, sortBy, sortDir controls |
| Get by ID | `GET` | `/api/v1/products/{id}` | UUID input |
| Search | `GET` | `/api/v1/products/search` | Keyword + pagination |
| By Category | `GET` | `/api/v1/products/category/{cat}` | Quick-select pill buttons |
| Update Product | `PUT` | `/api/v1/products/{id}` | "Load Current" auto-fills form from API |
| Update Stock | `PATCH` | `/api/v1/products/{id}/stock` | Quick-set 0 / 10 / 50 / 100 buttons |
| Delete Product | `DELETE` | `/api/v1/products/{id}` | Confirmation checkbox required |

---

## Tech Stack

| Library | Version | Purpose |
|---------|---------|---------|
| React | 18.3 | UI component framework |
| Vite | 5.4 | Dev server + production bundler |
| Tailwind CSS | 3.4 | Utility-first CSS styling |
| Axios | 1.7 | HTTP client for API calls |
| PostCSS + Autoprefixer | — | CSS processing pipeline for Tailwind |
