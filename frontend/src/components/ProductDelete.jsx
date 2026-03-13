import { useState } from 'react'
import { deleteProduct } from '../api/productApi'
import { useApiCall } from '../hooks/useApiCall'
import Field from './Field'
import ResponseViewer from './ResponseViewer'
import Section from './Section'
import SendButton from './SendButton'

export default function ProductDelete() {
  const [id, setId] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const { execute, result, loading } = useApiCall(deleteProduct)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (id.trim() && confirmed) {
      execute(id.trim())
      setConfirmed(false)
    }
  }

  return (
    <Section
      method="DELETE"
      endpoint="/api/v1/products/{id}"
      title="Delete Product"
      description="Soft-deletes the product by marking it as inactive. The record is kept in the database but excluded from all active product listings."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field
          label="Product UUID"
          placeholder="e.g. 3fa85f64-5717-4562-b3fc-2c963f66afa6"
          value={id}
          onChange={(e) => { setId(e.target.value); setConfirmed(false) }}
          required
        />

        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-red-500"
          />
          I confirm I want to soft-delete this product
        </label>

        {id.trim() && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            This will mark product <code className="font-mono bg-red-100 px-1 rounded">{id}</code> as inactive.
            It will no longer appear in active product listings.
          </div>
        )}

        <SendButton
          loading={loading}
          label="Delete Product"
          variant="danger"
          type="submit"
        />
      </form>

      <ResponseViewer result={result} loading={loading} />
    </Section>
  )
}
