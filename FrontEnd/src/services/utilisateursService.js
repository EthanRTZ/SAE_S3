/**
 * Service Utilisateurs – CRUD via l'API backend
 */
import api from './api.js'

export const utilisateursService = {
  /** Récupère tous les utilisateurs (admin) */
  getAll: () => api.get('/utilisateurs'),

  /** Récupère un utilisateur par son ID */
  getById: (id) => api.get(`/utilisateurs/${id}`),

  /** Met à jour un utilisateur */
  update: (id, payload) => api.put(`/utilisateurs/${id}`, payload),

  /** Supprime un utilisateur */
  delete: (id) => api.delete(`/utilisateurs/${id}`),
}

