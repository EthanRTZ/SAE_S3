/**
 * Store Pinia – Authentification globale
 *
 * Centralise l'état de connexion pour toute l'application.
 * Usage : const auth = useAuthStore()
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { logout as apiLogout, getCurrentUser } from '@/services/authService.js'
import { getToken } from '@/services/api.js'

export const useAuthStore = defineStore('auth', () => {
  // ─── État ────────────────────────────────────────────────────────────────
  const user = ref(null)
  const loading = ref(false)

  // ─── Getters ─────────────────────────────────────────────────────────────
  const isLoggedIn = computed(() => !!user.value && !!getToken())
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isPrestataire = computed(() => user.value?.role === 'prestataire')
  const userRole = computed(() => user.value?.role || null)
  const userName = computed(() => user.value?.nom || user.value?.email || '')

  // ─── Actions ─────────────────────────────────────────────────────────────

  /**
   * Charge l'utilisateur depuis le localStorage (appelé au démarrage de l'app).
   */
  function loadFromStorage() {
    try {
      const raw = localStorage.getItem('authUser')
      user.value = raw ? JSON.parse(raw) : null
    } catch (_) {
      user.value = null
    }
  }

  /**
   * Rafraîchit les infos utilisateur depuis l'API (si connecté).
   */
  async function fetchCurrentUser() {
    if (!getToken()) return
    loading.value = true
    try {
      const data = await getCurrentUser()
      user.value = data
      localStorage.setItem('authUser', JSON.stringify(data))
    } catch (_) {
      // Token expiré ou invalide → déconnexion
      user.value = null
    } finally {
      loading.value = false
    }
  }

  /**
   * Déconnecte l'utilisateur (API + local).
   */
  async function logout() {
    await apiLogout()
    user.value = null
  }

  /**
   * Met à jour manuellement l'utilisateur (après login).
   */
  function setUser(u) {
    user.value = u
  }

  return {
    user,
    loading,
    isLoggedIn,
    isAdmin,
    isPrestataire,
    userRole,
    userName,
    loadFromStorage,
    fetchCurrentUser,
    logout,
    setUser,
  }
})

