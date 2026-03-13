import { useState } from 'react'
import { searchProducts } from '../api/productApi'
import { useApiCall } from '../hooks/useApiCall'
import Field from './Field'
import ResponseViewer from './ResponseViewer'
import Section from './Section'
import SendButton from './SendButton'

export default function ProductSearch() {
  const [params, setParams] = useState({ search: '', page: 0, size: 10 })
  const { execute, result, loading } = useApiCall(searchProducts)

  const set = (key) => (e) => setParams((p) => ({ ...p, [key]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    execute(params)
  }

  return (
    <Section
      method="GET"
      endpoint="/api/v1/products/search"
      title="Search Products"
      description="Full-text search across product name and category. Leave search empty to return all."
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <Field
          label="Search Keyword"
          placeholder="e.g. MacBook or Electronics"
          value={params.search}
          onChange={set('search')}
          hint="Searches in name and category fields"
        />
        <div className="flex gap-3">
          <Field label="Page" type="number" min="0" value={params.page} onChange={set('page')} />
          <Field label="Size" type="number" min="1" value={params.size} onChange={set('size')} />
        </div>
        <SendButton loading={loading} label="Search" />
      </form>

      <ResponseViewer result={result} loading={loading} />
    </Section>
  )
}
