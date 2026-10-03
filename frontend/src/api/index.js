import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Dashboard endpoints
export const getDashboardSummary = () => api.get('/api/dashboard/summary')
export const getDashboardTrend = () => api.get('/api/dashboard/trend')
export const getRiskDistribution = () => api.get('/api/dashboard/risk-distribution')

// Customer endpoints
export const getCustomers = (params) => api.get('/api/customers', { params })
export const getCustomer = (id) => api.get(`/api/customers/${id}`)
export const deleteCustomer = (id) => api.delete(`/api/customers/${id}`)

// Prediction endpoint
export const predictChurn = (data) => api.post('/api/predict', data)

export default api

