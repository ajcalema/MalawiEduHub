import axios from 'axios'
import Cookies from 'js-cookie'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

// Main axios instance
const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

// Attach access token to every request
// For FormData, remove Content-Type so browser can set it with boundary
api.interceptors.request.use((config) => {
  const token = Cookies.get('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  
  // If sending FormData, remove explicit Content-Type header
  // so the browser can set it with the proper multipart boundary
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }
  
  return config
})

// Auto-refresh on 401 and recover missing/expired token cases
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    const responseError = error.response?.data?.error
    const responseCode = error.response?.data?.code
    const shouldRefresh = error.response?.status === 401 && !original._retry && (
      responseCode === 'TOKEN_EXPIRED' ||
      responseError === 'No token provided.' ||
      responseError === 'Invalid token.'
    )

    if (shouldRefresh && !original.url?.endsWith('/auth/refresh')) {
      original._retry = true
      try {
        const refreshToken = Cookies.get('refreshToken')
        if (!refreshToken) throw new Error('No refresh token')

        const { data } = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken })
        Cookies.set('accessToken',  data.accessToken,  { expires: 1/96 }) // 15 min
        Cookies.set('refreshToken', data.refreshToken, { expires: 30 })
        original.headers.Authorization = `Bearer ${data.accessToken}`
        return api(original)
      } catch {
        // Refresh failed — clear session
        Cookies.remove('accessToken')
        Cookies.remove('refreshToken')
        Cookies.remove('user')
        window.location.href = '/auth/login'
      }
    }
    return Promise.reject(error)
  }
)

// ─── Auth ────────────────────────────────────
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login',    data),
  logout:   (data) => api.post('/auth/logout',   data),
  profile:  ()     => api.get('/auth/profile'),
  refresh:  (data) => api.post('/auth/refresh',  data),
}

// ─── Documents ───────────────────────────────
export const documentsApi = {
  browse:   (params) => api.get('/documents', { params }),
  get:      (id)     => api.get(`/documents/${id}`),
  download: (id)     => api.get(`/documents/${id}/download`),
  upload:   (formData) => api.post('/documents/upload', formData),
  downloads: ()      => api.get('/documents/downloads/user'),
  // Admin
  queue:        ()   => api.get('/documents/admin/queue'),
  duplicateLog: ()   => api.get('/documents/admin/duplicate-log'),
  uploadAdmin:  (formData) => api.post('/documents/admin/upload', formData),
  approve: (id)      => api.patch(`/documents/admin/${id}/approve`),
  reject:  (id, reason) => api.patch(`/documents/admin/${id}/reject`, { reason }),
  update:  (id, data)   => api.patch(`/documents/admin/${id}`, data),
  delete:  (id)        => api.delete(`/documents/admin/${id}`),
}

// ─── Subjects ────────────────────────────────
export const subjectsApi = {
  /** @param {{ q?: string }} [params] — optional search string for autocomplete */
  list: (params) => api.get('/subjects', { params }),
}

// ─── Payments ────────────────────────────────
export const paymentsApi = {
  subscribe:    (data) => api.post('/payments/subscribe',    data),
  perDownload:  (data) => api.post('/payments/per-download', data),
  checkStatus:  (id)   => api.get(`/payments/status/${id}`),
  revenue:      (params) => api.get('/payments/admin/revenue', { params }),
}

// ─── Admin ───────────────────────────────────
export const adminApi = {
  stats:         ()    => api.get('/admin/stats'),
  users:         ()    => api.get('/admin/users'),
  suspendUser:   (id)  => api.patch(`/admin/users/${id}/suspend`),
  settings:      ()    => api.get('/admin/settings'),
  updateSetting: (key, value) => api.patch(`/admin/settings/${key}`, { value }),
}

export default api
