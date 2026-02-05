import { ref, computed } from 'vue'

export function useAdminAuth() {
  const authUser = ref(null)
  const loading = ref(true)

  const adminEmail = computed(() => authUser.value?.email || '')
  const isAdmin = computed(() => authUser.value?.role === 'admin')

  const loadAuthFromStorage = () => {
    try {
      const raw = localStorage.getItem('authUser')
      authUser.value = raw ? JSON.parse(raw) : null
    } catch (e) {
      authUser.value = null
    } finally {
      loading.value = false
    }
  }

  const checkAdminAccess = () => {
    // Retourne true si admin, sinon false (peut rediriger ailleurs au besoin)
    return isAdmin.value === true
  }

  return { authUser, loading, isAdmin, adminEmail, loadAuthFromStorage, checkAdminAccess }
}
