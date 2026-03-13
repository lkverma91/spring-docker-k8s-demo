import { useState } from 'react'
import { getProductById } from '../api/productApi'
import { useApiCall } from '../hooks/useApiCall'
import Field from './Field'
import ResponseViewer from './ResponseViewer'
import Section from './Section'
import SendButton from './SendButton'

export default function ProductGetById() {
  const [id, setId] = useState('')
  const { execute, result, loading } = useApiCall(getProductById)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (id.trim()) execute(id.trim())
  }

  return (
    <Section
      method="GET"
      endpoint="/api/v1/products/{id}"
      title="Get Product by ID"
      description="Fetch a single product by its UUID. Copy an ID from the Get All response above."
    >
      <form onSubmit={handleSubmit} className="flex gap-3">
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
          <SendButton loading={loading} label="Get" />
        </div>
      </form>

      <ResponseViewer result={result} loading={loading} />
    </Section>
  )
}
