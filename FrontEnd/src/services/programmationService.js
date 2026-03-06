/**
 * Service Programmation – via l'API backend
 */
import api from './api.js'

export const programmationService = {
  getAll: () => api.get('/programmation'),
  getById: (id) => api.get(`/programmation/${id}`),
  create: (payload) => api.post('/programmation', payload),
  update: (id, payload) => api.put(`/programmation/${id}`, payload),
  delete: (id) => api.delete(`/programmation/${id}`),
}

export default programmationService

