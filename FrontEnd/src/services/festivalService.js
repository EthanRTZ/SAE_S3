/**
 * Service Festival – via l'API backend (route /manifestations)
 */
import api from './api.js'

export const festivalService = {
  getAll: () => api.get('/manifestations'),
  getById: (id) => api.get(`/manifestations/${id}`),
  // Récupère le festival actif (le premier trouvé)
  getActif: async () => {
    const list = await api.get('/manifestations')
    return Array.isArray(list) ? (list.find(f => f.actif) || list[0] || null) : null
  },
  create: (payload) => api.post('/manifestations', payload),
  update: (id, payload) => api.put(`/manifestations/${id}`, payload),
  delete: (id) => api.delete(`/manifestations/${id}`),
}

export default festivalService

