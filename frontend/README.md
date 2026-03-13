# Spring API Tester — React Frontend

An interactive browser UI to test every endpoint of the Spring Boot Products CRUD API.
Click a button, fill a form, hit **Send** — and see the live JSON response instantly.

## Features

| Panel | Method | What it does |
|-------|--------|--------------|
| Health Check | GET | Ping `/actuator/health` |
| Create Product | POST | Submit a form to create a new product |
| Get All Products | GET | Paginated list with sort controls |
| Get by ID | GET | Fetch one product by UUID |
| Search | GET | Keyword search across name & category |
| By Category | GET | Filter by category (quick-select buttons) |
| Update Product | PUT | Load existing data, edit, and save |
| Update Stock | PATCH | Set new stock quantity with quick-set buttons |
| Delete Product | DELETE | Soft-delete with confirmation checkbox |

## How to Run

### Prerequisites
- Node.js 18+
- The Spring Boot backend running on `http://localhost:8080`

### Start dev server

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> The Vite dev server proxies all `/api` and `/actuator` requests to `http://localhost:8080` automatically — no CORS issues.

### Build for production

```bash
npm run build      # Output in frontend/dist/
npm run preview    # Serve the production build locally
```

## Project Structure

```
frontend/
├── index.html
├── vite.config.js        # Proxy /api → localhost:8080
├── tailwind.config.js
├── src/
│   ├── main.jsx
│   ├── App.jsx           # Sidebar navigation + panel switcher
│   ├── index.css         # Tailwind directives + base styles
│   ├── api/
│   │   └── productApi.js # All API call functions with timing
│   ├── hooks/
│   │   └── useApiCall.js # Generic loading/result state hook
│   └── components/
│       ├── ResponseViewer.jsx   # JSON output with status badge
│       ├── Section.jsx          # Card wrapper for each endpoint
│       ├── Field.jsx            # Labeled input/textarea
│       ├── SendButton.jsx       # Consistent submit button
│       ├── HealthCheck.jsx
│       ├── ProductCreate.jsx
│       ├── ProductList.jsx
│       ├── ProductGetById.jsx
│       ├── ProductSearch.jsx
│       ├── ProductByCategory.jsx
│       ├── ProductUpdate.jsx
│       ├── ProductStock.jsx
│       └── ProductDelete.jsx
```
