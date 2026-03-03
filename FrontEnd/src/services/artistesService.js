/**
 * Service Artistes – CRUD via l'API backend
 */
import api from './api.js'

export const artistesService = {
  /** Récupère tous les artistes */
  getAll: () => api.get('/artistes'),

  /** Récupère un artiste par son ID */
  getById: (id) => api.get(`/artistes/${id}`),

  /** Crée un nouvel artiste */
  create: (payload) => api.post('/artistes', payload),

  /** Met à jour un artiste */
  update: (id, payload) => api.put(`/artistes/${id}`, payload),

  /** Supprime un artiste */
  delete: (id) => api.delete(`/artistes/${id}`),
}

