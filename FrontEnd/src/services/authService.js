/**
 * Service Auth – inscription, connexion, déconnexion
 */
import api, { setToken, removeToken } from './api.js'

/**
 * Connexion d'un utilisateur.
 * @param {string} email
 * @param {string} motDePasse
 * @returns {{ token: string, user: object }}
 */
export async function login(email, motDePasse) {
  const data = await api.post('/auth/login', { email, mot_de_passe: motDePasse })
  if (data.token) {
    setToken(data.token)
    localStorage.setItem('authUser', JSON.stringify(data.user))
    window.dispatchEvent(new Event('auth-changed'))
  }
  return data
}

/**
 * Inscription d'un nouvel utilisateur.
 * @param {{ email: string, password: string, nom?: string }} payload
 */
export async function register({ email, password, nom }) {
  const data = await api.post('/auth/register', {
    nom_utilisateur: nom || email.split('@')[0],
    email,
    mot_de_passe: password,
  })
  // Connexion automatique après inscription
  if (data.token) {
    setToken(data.token)
    localStorage.setItem('authUser', JSON.stringify(data.user))
    window.dispatchEvent(new Event('auth-changed'))
  }
  return data
}

/**
 * Déconnexion (invalide le token côté serveur + nettoyage local).
 */
export async function logout() {
  try {
    await api.post('/auth/logout', {})
  } catch (_) {
    // Même en cas d'erreur réseau, on nettoie côté client
  } finally {
    removeToken()
    window.dispatchEvent(new Event('auth-changed'))
  }
}

/**
 * Récupère l'utilisateur actuellement connecté depuis l'API.
 */
export async function getCurrentUser() {
  return api.get('/auth/me')
}
