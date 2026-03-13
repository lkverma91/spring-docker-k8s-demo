import { useState } from 'react'
import { updateProduct, getProductById } from '../api/productApi'
import { useApiCall } from '../hooks/useApiCall'
import Field from './Field'
import ResponseViewer from './ResponseViewer'
import Section from './Section'
import SendButton from './SendButton'

const EMPTY_FORM = { name: '', description: '', price: '', category: '', stock: '', active: true }

export default function ProductUpdate() {
  const [id, setId] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const { execute, result, loading } = useApiCall(updateProduct)
  const fetchCall = useApiCall(getProductById)

  const set = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  // Auto-fill form by loading existing product data
  const loadExisting = async () => {
    if (!id.trim()) return
    const res = await fetchCall.execute(id.trim())
    if (res.ok && res.data?.data) {
      const p = res.data.data
      setForm({
        name: p.name ?? '',
        description: p.description ?? '',
        price: String(p.price ?? ''),
        category: p.category ?? '',
        stock: String(p.stock ?? ''),
        active: p.active ?? true,
      })
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!id.trim()) return
    execute(id.trim(), {
      ...form,
      price: parseFloat(form.price),
      stock: parseInt(form.stock, 10),
    })
  }

  return (
    <Section
      method="PUT"
      endpoint="/api/v1/products/{id}"
      title="Update Product (Full)"
      description="Replace all product fields. Enter the UUID and optionally load current values, then edit and submit."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <Field
              label="Product UUID"
              placeholder="e.g. 3fa85f64-5717-4562-b3fc-2c963f66afa6"
              value={id}
              onChange={(e) => setId(e.target.value)}
              required
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={loadExisting}
              disabled={fetchCall.loading || !id.trim()}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors"
            >
              {fetchCall.loading ? 'Loading…' : 'Load Current'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Name" placeholder="Product name" value={form.name} onChange={set('name')} required />
          <Field label="Category" placeholder="Category" value={form.category} onChange={set('category')} required />
          <Field label="Price" type="number" step="0.01" min="0.01" value={form.price} onChange={set('price')} required />
          <Field label="Stock" type="number" min="0" value={form.stock} onChange={set('stock')} required />
        </div>

        <Field label="Description" textarea placeholder="Product description…" value={form.description} onChange={set('description')} />

        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={form.active}
            onChange={set('active')}
            className="h-4 w-4 rounded border-slate-300 text-amber-500"
          />
          Active
        </label>

        <SendButton loading={loading} label="Update Product" variant="warning" />
      </form>

      <ResponseViewer result={result} loading={loading} />
    </Section>
  )
}
