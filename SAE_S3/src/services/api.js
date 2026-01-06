// Service API pour communiquer avec le backend
const API_BASE_URL = 'http://localhost:3000/api';

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
    const response = await fetch(`${API_BASE_URL}/artistes`);
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
    const response = await fetch(`${API_BASE_URL}/prestataires`);
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
    const response = await fetch(`${API_BASE_URL}/services`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export default {
  testBackendConnection,
  getAllArtistes,
  getAllPrestataires,
  getAllServices,
};

