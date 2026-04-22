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
api.interceptors.request.use((config) => {
  const token = Cookies.get('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-refresh on 401 TOKEN_EXPIRED
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (
      error.response?.status === 401 &&
      error.response?.data?.code === 'TOKEN_EXPIRED' &&
      !original._retry
    ) {
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
  upload:   (formData) => api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  // Admin
  queue:        ()   => api.get('/documents/admin/queue'),
  duplicateLog: ()   => api.get('/documents/admin/duplicate-log'),
  allRequests:  ()   => api.get('/documents/admin/requests'),
  approve: (id)      => api.patch(`/documents/admin/${id}/approve`),
  reject:  (id, reason) => api.patch(`/documents/admin/${id}/reject`, { reason }),
  update:  (id, data)   => api.patch(`/documents/admin/${id}`, data),
}

// ─── Subjects ────────────────────────────────
export const subjectsApi = {
  list: () => api.get('/subjects'),
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

// ─── Learning Room API ─────────────────────
export const learnApi = {
  getClasses:          ()                           => api.get('/learn/classes'),
  getSubjects:         (classId)                    => api.get(`/learn/classes/${classId}/subjects`),
  getTopics:           (classId, subjectId)         => api.get(`/learn/classes/${classId}/subjects/${subjectId}/topics`),
  getResources:        (topicId)                    => api.get(`/learn/topics/${topicId}/resources`),
  markProgress:        (topicId, completed)         => api.post(`/learn/topics/${topicId}/progress`, { completed }),
  getProgress:         ()                           => api.get('/learn/progress'),
  adminClasses:        ()                           => api.get('/learn/admin/classes'),
  adminTopics:         (params)                     => api.get('/learn/admin/topics', { params }),
  adminCreateTopic:    (data)                       => api.post('/learn/admin/topics', data),
  adminUpdateTopic:    (id, data)                   => api.put(`/learn/admin/topics/${id}`, data),
  adminDeleteTopic:    (id)                         => api.delete(`/learn/admin/topics/${id}`),
  adminAddResource:    (topicId, documentId)        => api.post(`/learn/admin/topics/${topicId}/resources`, { document_id: documentId }),
  adminRemoveResource: (topicId, documentId)        => api.delete(`/learn/admin/topics/${topicId}/resources/${documentId}`),
  adminAddSubject:     (classId, subjectId)         => api.post(`/learn/admin/classes/${classId}/subjects`, { subject_id: subjectId }),
  adminRemoveSubject:  (classId, subjectId)         => api.delete(`/learn/admin/classes/${classId}/subjects/${subjectId}`),
}
