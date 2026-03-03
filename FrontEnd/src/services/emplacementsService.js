/**
 * Service Emplacements – CRUD via l'API backend
 */
import api from './api.js'

export const emplacementsService = {
  getAll: () => api.get('/emplacements'),
  getById: (id) => api.get(`/emplacements/${id}`),
  create: (payload) => api.post('/emplacements', payload),
  update: (id, payload) => api.put(`/emplacements/${id}`, payload),
  delete: (id) => api.delete(`/emplacements/${id}`),
}

