/**
 * Point d'entrée centralisé pour tous les services API
 * Usage : import { artistesService, login, ... } from '@/services'
 */
export { default as api, getToken, setToken, removeToken } from './api.js'
export * from './authService.js'
export { artistesService } from './artistesService.js'
export { prestatairesService } from './prestatairesService.js'
export { utilisateursService } from './utilisateursService.js'
export { emplacementsService } from './emplacementsService.js'
export { statsService } from './statsService.js'

