// Service API pour communiquer avec le backend
const API_BASE_URL = 'http://localhost:3000/api';

/**
 * Récupérer le token d'authentification depuis le localStorage
 */
function getAuthToken() {
  return localStorage.getItem('authToken');
}

/**
 * Fonction helper pour faire des requêtes authentifiées
 */
async function authenticatedFetch(url, options = {}) {
  const token = getAuthToken();

  // Ajouter le token dans les headers si disponible
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Test de connexion au backend
 */
export async function testBackendConnection() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Récupérer tous les artistes
 */
export async function getAllArtistes() {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/artistes`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Récupérer tous les prestataires
 */
export async function getAllPrestataires() {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/prestataires`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Récupérer tous les services
 */
export async function getAllServices() {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/services`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Connexion utilisateur
 */
export async function login(email, mot_de_passe) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, mot_de_passe }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();

    // Stocker le token dans le localStorage
    if (data.token) {
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Inscription utilisateur
 */
export async function register(nom_utilisateur, email, mot_de_passe, role = 'public') {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ nom_utilisateur, email, mot_de_passe, role }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Déconnexion utilisateur
 */
export async function logout() {
  try {
    const token = getAuthToken();

    if (token) {
      await authenticatedFetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
      });
    }

    // Supprimer le token et les infos utilisateur
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');

    return { success: true };
  } catch (error) {
    // Même en cas d'erreur, on nettoie le localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    return { success: false, error: error.message };
  }
}

/**
 * Vérifier si l'utilisateur est authentifié
 */
export function isAuthenticated() {
  return !!getAuthToken();
}

/**
 * Récupérer les informations de l'utilisateur connecté
 */
export function getCurrentUser() {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

export default {
  testBackendConnection,
  getAllArtistes,
  getAllPrestataires,
  getAllServices,
  login,
  register,
  logout,
  isAuthenticated,
  getCurrentUser,
};

