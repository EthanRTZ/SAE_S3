/**
 * Service Prestataires – CRUD via l'API backend
 */
import api from './api.js'

export const prestatairesService = {
  /** Récupère tous les prestataires */
  getAll: () => api.get('/prestataires'),

  /** Récupère un prestataire par son ID */
  getById: (id) => api.get(`/prestataires/${id}`),

  /** Crée un nouveau prestataire */
  create: (payload) => api.post('/prestataires', payload),

  /** Met à jour un prestataire */
  update: (id, payload) => api.put(`/prestataires/${id}`, payload),

  /** Supprime un prestataire */
  delete: (id) => api.delete(`/prestataires/${id}`),
}

