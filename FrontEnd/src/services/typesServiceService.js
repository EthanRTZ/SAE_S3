import api from './api.js'

export const typesServiceService = {
  /**
   * Récupère tous les types de service (réservation, commande, location)
   */
  getAll() {
    return api.get('/types-service')
  },

  /**
   * Récupère un type de service par ID
   */
  getById(id) {
    return api.get(`/types-service/${id}`)
  },

  /**
   * Récupère tous les services d'un type donné (par ID)
   */
  getServicesByTypeId(id) {
    return api.get(`/types-service/${id}/services`)
  },

  /**
   * Récupère tous les services d'un type donné (par nom: reservation, commande, location)
   */
  getServicesByTypeName(nom) {
    return api.get(`/types-service/nom/${nom}/services`)
  }
}

