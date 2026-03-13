import { useState } from 'react'
import { createProduct } from '../api/productApi'
import { useApiCall } from '../hooks/useApiCall'
import Field from './Field'
import ResponseViewer from './ResponseViewer'
import Section from './Section'
import SendButton from './SendButton'

const INITIAL = {
  name: '',
  description: '',
  price: '',
  category: '',
  stock: '',
  active: true,
}

export default function ProductCreate() {
  const [form, setForm] = useState(INITIAL)
  const { execute, result, loading } = useApiCall(createProduct)

  const set = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    execute({
      ...form,
      price: parseFloat(form.price),
      stock: parseInt(form.stock, 10),
    })
  }

  const fillSample = () =>
    setForm({
      name: 'MacBook Pro 14"',
      description: 'Apple MacBook Pro with M3 chip, 16GB RAM',
      price: '1999.99',
      category: 'Electronics',
      stock: '25',
      active: true,
    })

  return (
    <Section
      method="POST"
      endpoint="/api/v1/products"
      title="Create Product"
      description="Create a new product. All fields marked with * are required."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={fillSample}
            className="text-xs text-indigo-600 hover:text-indigo-800 underline underline-offset-2"
          >
            Fill sample data
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Name" placeholder="e.g. MacBook Pro" value={form.name} onChange={set('name')} required />
          <Field label="Category" placeholder="e.g. Electronics" value={form.category} onChange={set('category')} required />
          <Field label="Price" type="number" step="0.01" min="0.01" placeholder="e.g. 1999.99" value={form.price} onChange={set('price')} required />
          <Field label="Stock" type="number" min="0" placeholder="e.g. 50" value={form.stock} onChange={set('stock')} required />
        </div>

        <Field label="Description" textarea placeholder="Optional product description…" value={form.description} onChange={set('description')} />

        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={form.active}
            onChange={set('active')}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600"
          />
          Active (visible to customers)
        </label>

        <SendButton loading={loading} label="Create Product" variant="success" />
      </form>

      <ResponseViewer result={result} loading={loading} />
    </Section>
  )
}
