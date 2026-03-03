/**
 * Service Stats – statistiques via l'API backend
 */
import api from './api.js'

export const statsService = {
  getAll: () => api.get('/stats'),
}

