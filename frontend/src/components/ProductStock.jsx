import { useState } from 'react'
import { updateStock } from '../api/productApi'
import { useApiCall } from '../hooks/useApiCall'
import Field from './Field'
import ResponseViewer from './ResponseViewer'
import Section from './Section'
import SendButton from './SendButton'

export default function ProductStock() {
  const [id, setId] = useState('')
  const [stock, setStock] = useState('')
  const { execute, result, loading } = useApiCall(updateStock)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (id.trim() && stock !== '') execute(id.trim(), parseInt(stock, 10))
  }

  return (
    <Section
      method="PATCH"
      endpoint="/api/v1/products/{id}/stock"
      title="Update Stock"
      description="Partially update only the stock quantity of a product without changing other fields."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field
          label="Product UUID"
          placeholder="e.g. 3fa85f64-5717-4562-b3fc-2c963f66afa6"
          value={id}
          onChange={(e) => setId(e.target.value)}
          required
        />

        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Field
              label="New Stock Quantity"
              type="number"
              min="0"
              placeholder="e.g. 100"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              required
              hint="Must be 0 or greater"
            />
          </div>

          {/* Quick-set buttons */}
          <div className="flex gap-1 items-end pb-0.5">
            {[0, 10, 50, 100].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setStock(String(n))}
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors
                  ${String(n) === stock
                    ? 'border-purple-400 bg-purple-600 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-purple-300'}`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <SendButton loading={loading} label="Update Stock" variant="purple" />
      </form>

      <ResponseViewer result={result} loading={loading} />
    </Section>
  )
}
