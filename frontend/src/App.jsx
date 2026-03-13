import { useState } from 'react'
import HealthCheck from './components/HealthCheck'
import ProductCreate from './components/ProductCreate'
import ProductList from './components/ProductList'
import ProductGetById from './components/ProductGetById'
import ProductSearch from './components/ProductSearch'
import ProductByCategory from './components/ProductByCategory'
import ProductUpdate from './components/ProductUpdate'
import ProductStock from './components/ProductStock'
import ProductDelete from './components/ProductDelete'

const NAV = [
  { id: 'health',    label: 'Health Check',     method: 'GET',    color: 'emerald' },
  { id: 'create',    label: 'Create Product',    method: 'POST',   color: 'emerald' },
  { id: 'list',      label: 'Get All Products',  method: 'GET',    color: 'blue' },
  { id: 'getById',   label: 'Get by ID',         method: 'GET',    color: 'blue' },
  { id: 'search',    label: 'Search',            method: 'GET',    color: 'blue' },
  { id: 'category',  label: 'By Category',       method: 'GET',    color: 'blue' },
  { id: 'update',    label: 'Update Product',    method: 'PUT',    color: 'amber' },
  { id: 'stock',     label: 'Update Stock',      method: 'PATCH',  color: 'purple' },
  { id: 'delete',    label: 'Delete Product',    method: 'DELETE', color: 'red' },
]

const METHOD_PILL = {
  GET:    'bg-blue-100 text-blue-700',
  POST:   'bg-emerald-100 text-emerald-700',
  PUT:    'bg-amber-100 text-amber-700',
  PATCH:  'bg-purple-100 text-purple-700',
  DELETE: 'bg-red-100 text-red-700',
}

const PANELS = {
  health:   <HealthCheck />,
  create:   <ProductCreate />,
  list:     <ProductList />,
  getById:  <ProductGetById />,
  search:   <ProductSearch />,
  category: <ProductByCategory />,
  update:   <ProductUpdate />,
  stock:    <ProductStock />,
  delete:   <ProductDelete />,
}

export default function App() {
  const [active, setActive] = useState('health')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* ── Sidebar ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-white border-r border-slate-200 shadow-sm
          transform transition-transform duration-200 md:relative md:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
          <span className="text-xl">🧪</span>
          <div>
            <p className="text-sm font-bold text-slate-800">API Tester</p>
            <p className="text-xs text-slate-400">Spring Boot Products</p>
          </div>
        </div>

        {/* Base URL indicator */}
        <div className="mx-3 mt-3 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
          <p className="text-xs text-slate-400 mb-0.5">Base URL</p>
          <p className="font-mono text-xs text-slate-600 break-all">http://localhost:8080</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActive(item.id); setSidebarOpen(false) }}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors
                ${active === item.id
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
            >
              <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide ${METHOD_PILL[item.method]}`}>
                {item.method}
              </span>
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-100 px-4 py-3">
          <p className="text-xs text-slate-400">v1.0.0 · Spring Boot 3.4</p>
        </div>
      </aside>

      {/* ── Backdrop (mobile) ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Main content ── */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center gap-4 border-b border-slate-200 bg-white px-5 py-3 shadow-sm">
          <button
            className="md:hidden text-slate-500 hover:text-slate-800"
            onClick={() => setSidebarOpen(true)}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            <span className={`rounded-md px-2 py-0.5 text-xs font-bold tracking-wide ${METHOD_PILL[NAV.find(n => n.id === active)?.method]}`}>
              {NAV.find(n => n.id === active)?.method}
            </span>
            <h1 className="text-sm font-semibold text-slate-800">
              {NAV.find(n => n.id === active)?.label}
            </h1>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <a
              href="http://localhost:8080/swagger-ui.html"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Swagger UI
            </a>
          </div>
        </header>

        {/* Panel area */}
        <main className="flex-1 overflow-y-auto px-5 py-6">
          <div className="mx-auto max-w-3xl">
            {PANELS[active]}
          </div>
        </main>
      </div>
    </div>
  )
}
