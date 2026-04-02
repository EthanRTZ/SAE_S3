/**
 * Service API centralisé – liaison Frontend ↔ Backend
 *
 * Toutes les requêtes vers le backend passent par ce fichier.
 * Le token JWT est automatiquement ajouté dans les headers si présent.
 */

// En développement, le proxy Vite redirige /api → http://localhost:3000/api
// En production, VITE_API_URL doit pointer vers l'URL réelle du serveur
const BASE_URL = import.meta.env.VITE_API_URL || '/api'

// ─── Gestion du token ──────────────────────────────────────────────────────

export function getToken() {
  return localStorage.getItem('authToken')
}

export function setToken(token) {
  localStorage.setItem('authToken', token)
}

export function removeToken() {
  localStorage.removeItem('authToken')
  // Ne pas supprimer authUser pour préserver l'info de rôle
  // L'utilisateur sera redirigé vers login pour se reconnecter
}

// ─── Client HTTP ────────────────────────────────────────────────────────────

/**
 * Effectue une requête vers l'API backend.
 * @param {string} endpoint  - Chemin relatif, ex: '/artistes'
 * @param {RequestInit} options - Options fetch standard (method, body, etc.)
 * @returns {Promise<any>}
 */
async function request(endpoint, options = {}) {
  const token = getToken()

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  // Si le serveur répond 401 → déconnexion automatique
  if (response.status === 401) {
    removeToken()
    window.dispatchEvent(new Event('auth-changed'))
    throw new Error('Non authentifié – veuillez vous reconnecter.')
  }

  // Tenter de parser le JSON, sinon retourner le texte brut
  const contentType = response.headers.get('content-type') || ''
  const data = contentType.includes('application/json')
    ? await response.json()
    : await response.text()

  if (!response.ok) {
    const message =
      (data && data.message) ||
      (data && data.error) ||
      `Erreur ${response.status}`
    throw new Error(message)
  }

  return data
}

// ─── Méthodes HTTP raccourcies ───────────────────────────────────────────────

export const api = {
  get: (endpoint) => request(endpoint, { method: 'GET' }),

  post: (endpoint, body) =>
    request(endpoint, { method: 'POST', body: JSON.stringify(body) }),

  put: (endpoint, body) =>
    request(endpoint, { method: 'PUT', body: JSON.stringify(body) }),

  patch: (endpoint, body) =>
    request(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),

  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
}

export default api

