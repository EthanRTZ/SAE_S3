/**
 * Service Équipements – via l'API backend
 */
import api from './api.js'

export const equipementsService = {
  getAll: () => api.get('/equipements'),
  getById: (id) => api.get(`/equipements/${id}`),
  create: (payload) => api.post('/equipements', payload),
  update: (id, payload) => api.put(`/equipements/${id}`, payload),
  delete: (id) => api.delete(`/equipements/${id}`),
}

export default equipementsService

