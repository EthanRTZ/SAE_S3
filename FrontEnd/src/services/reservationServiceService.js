/**
 * Service pour les réservations de services (pas de billets)
 */
import api from './api.js'

export const reservationServiceService = {
  // Réservations de l'utilisateur connecté
  getMyReservations: () => api.get('/services/reservations/me'),

  // Créer une réservation de service
  createReservation: (payload) => api.post('/services/reservations', payload),

  // Modifier une réservation
  updateReservation: (id, payload) => api.put(`/services/reservations/${id}`, payload),

  // Supprimer une réservation
  deleteReservation: (id) => api.delete(`/services/reservations/${id}`),
}

export default reservationServiceService

