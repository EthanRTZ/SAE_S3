/**
 * Service Zones – via l'API backend
 */
import api from './api.js'

export const zonesService = {
  getAll: () => api.get('/zones'),
  getById: (id) => api.get(`/zones/${id}`),
  create: (payload) => api.post('/zones', payload),
  update: (id, payload) => api.put(`/zones/${id}`, payload),
  delete: (id) => api.delete(`/zones/${id}`),
}

export default zonesService

