/**
 * Service Avis – via l'API backend
 */
import api from './api.js'

export const avisService = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return api.get(`/avis${query ? '?' + query : ''}`)
  },
  getByPrestataire: (nomOuId) => api.get(`/avis/prestataire/${encodeURIComponent(nomOuId)}`),
  getById: (id) => api.get(`/avis/${id}`),
  create: (payload) => api.post('/avis', payload),
  update: (id, payload) => api.put(`/avis/${id}`, payload),
  delete: (id) => api.delete(`/avis/${id}`),
}

export default avisService

