import { healthCheck } from '../api/productApi'
import { useApiCall } from '../hooks/useApiCall'
import ResponseViewer from './ResponseViewer'
import Section from './Section'
import SendButton from './SendButton'

export default function HealthCheck() {
  const { execute, result, loading } = useApiCall(healthCheck)

  return (
    <Section
      method="GET"
      endpoint="/actuator/health"
      title="Health Check"
      description="Ping the Spring Boot Actuator health endpoint to confirm the application and database are running."
    >
      <SendButton loading={loading} label="Check Health" variant="success" type="button" onClick={execute} />
      <ResponseViewer result={result} loading={loading} />
    </Section>
  )
}
