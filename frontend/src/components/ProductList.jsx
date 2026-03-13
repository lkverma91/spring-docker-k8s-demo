import { useState } from 'react'
import { getAllProducts } from '../api/productApi'
import { useApiCall } from '../hooks/useApiCall'
import Field from './Field'
import ResponseViewer from './ResponseViewer'
import Section from './Section'
import SendButton from './SendButton'

export default function ProductList() {
  const [params, setParams] = useState({ page: 0, size: 10, sortBy: 'createdAt', sortDir: 'desc' })
  const { execute, result, loading } = useApiCall(getAllProducts)

  const set = (key) => (e) => setParams((p) => ({ ...p, [key]: e.target.value }))

  return (
    <Section
      method="GET"
      endpoint="/api/v1/products"
      title="Get All Products"
      description="Returns a paginated list of all active products. Use pagination and sorting controls below."
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-4">
        <Field label="Page" type="number" min="0" value={params.page} onChange={set('page')} hint="0-indexed" />
        <Field label="Size" type="number" min="1" max="100" value={params.size} onChange={set('size')} />
        <Field label="Sort By" placeholder="createdAt" value={params.sortBy} onChange={set('sortBy')} hint="name, price, stock…" />
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sort Dir</label>
          <select
            value={params.sortDir}
            onChange={set('sortDir')}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>

      <SendButton loading={loading} label="Fetch Products" type="button" onClick={() => execute(params)} />
      <ResponseViewer result={result} loading={loading} />
    </Section>
  )
}
