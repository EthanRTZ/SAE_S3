/**
 * Service Billets/Forfaits – via l'API backend
 */
import api from './api.js'

export const billetsService = {
  getAll: () => api.get('/billets'),
  getById: (id) => api.get(`/billets/${id}`),
  create: (payload) => api.post('/billets', payload),
  update: (id, payload) => api.put(`/billets/${id}`, payload),
  delete: (id) => api.delete(`/billets/${id}`),

  // Réservations
  getReservationsByUser: (userId) => api.get(`/billets/reservations/user/${userId}`),
  createReservation: (payload) => api.post('/billets/reservations', payload),
  updateReservation: (id, payload) => api.put(`/billets/reservations/${id}`, payload),
}

export default billetsService

