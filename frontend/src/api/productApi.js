import axios from 'axios'

const BASE_URL = '/api/v1/products'
const ACTUATOR_URL = '/actuator'

// Axios instance with interceptors to capture raw request/response details
const client = axios.create({ baseURL: '/' })

/**
 * Wraps an axios call and returns a structured result object with
 * timing, status, headers and body — used by the UI to display output.
 */
async function call(config) {
  const start = Date.now()
  try {
    const res = await client.request(config)
    return {
      ok: true,
      status: res.status,
      statusText: res.statusText,
      data: res.data,
      headers: res.headers,
      durationMs: Date.now() - start,
      method: config.method?.toUpperCase(),
      url: config.url,
    }
  } catch (err) {
    const res = err.response
    return {
      ok: false,
      status: res?.status ?? 0,
      statusText: res?.statusText ?? 'Network Error',
      data: res?.data ?? { message: err.message },
      headers: res?.headers ?? {},
      durationMs: Date.now() - start,
      method: config.method?.toUpperCase(),
      url: config.url,
    }
  }
}

// ── Health ─────────────────────────────────────────────────────────────────
export const healthCheck = () =>
  call({ method: 'GET', url: `${ACTUATOR_URL}/health` })

// ── Create Product ─────────────────────────────────────────────────────────
export const createProduct = (body) =>
  call({ method: 'POST', url: BASE_URL, data: body })

// ── Get All Products ───────────────────────────────────────────────────────
export const getAllProducts = ({ page = 0, size = 10, sortBy = 'createdAt', sortDir = 'desc' } = {}) =>
  call({
    method: 'GET',
    url: BASE_URL,
    params: { page, size, sortBy, sortDir },
  })

// ── Get Product by ID ──────────────────────────────────────────────────────
export const getProductById = (id) =>
  call({ method: 'GET', url: `${BASE_URL}/${id}` })

// ── Search Products ────────────────────────────────────────────────────────
export const searchProducts = ({ search = '', page = 0, size = 10 } = {}) =>
  call({
    method: 'GET',
    url: `${BASE_URL}/search`,
    params: { search, page, size },
  })

// ── Get by Category ────────────────────────────────────────────────────────
export const getByCategory = ({ category, page = 0, size = 10 } = {}) =>
  call({
    method: 'GET',
    url: `${BASE_URL}/category/${encodeURIComponent(category)}`,
    params: { page, size },
  })

// ── Update Product ─────────────────────────────────────────────────────────
export const updateProduct = (id, body) =>
  call({ method: 'PUT', url: `${BASE_URL}/${id}`, data: body })

// ── Update Stock ───────────────────────────────────────────────────────────
export const updateStock = (id, stock) =>
  call({
    method: 'PATCH',
    url: `${BASE_URL}/${id}/stock`,
    params: { stock },
  })

// ── Delete Product ─────────────────────────────────────────────────────────
export const deleteProduct = (id) =>
  call({ method: 'DELETE', url: `${BASE_URL}/${id}` })
