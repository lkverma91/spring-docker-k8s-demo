import { useState } from 'react'
import { getByCategory } from '../api/productApi'
import { useApiCall } from '../hooks/useApiCall'
import Field from './Field'
import ResponseViewer from './ResponseViewer'
import Section from './Section'
import SendButton from './SendButton'

const CATEGORIES = ['Electronics', 'Furniture', 'Clothing', 'Books', 'Sports', 'Testing']

export default function ProductByCategory() {
  const [params, setParams] = useState({ category: '', page: 0, size: 10 })
  const { execute, result, loading } = useApiCall(getByCategory)

  const set = (key) => (e) => setParams((p) => ({ ...p, [key]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (params.category.trim()) execute({ ...params, category: params.category.trim() })
  }

  return (
    <Section
      method="GET"
      endpoint="/api/v1/products/category/{category}"
      title="Get by Category"
      description="Returns all active products in the specified category, sorted by name."
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setParams((p) => ({ ...p, category: cat }))}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors
                ${params.category === cat
                  ? 'border-indigo-400 bg-indigo-600 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-600'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        <Field
          label="Category"
          placeholder="e.g. Electronics"
          value={params.category}
          onChange={set('category')}
          required
          hint="Or type a custom category name"
        />
        <div className="flex gap-3">
          <Field label="Page" type="number" min="0" value={params.page} onChange={set('page')} />
          <Field label="Size" type="number" min="1" value={params.size} onChange={set('size')} />
        </div>
        <SendButton loading={loading} label="Get by Category" />
      </form>

      <ResponseViewer result={result} loading={loading} />
    </Section>
  )
}
